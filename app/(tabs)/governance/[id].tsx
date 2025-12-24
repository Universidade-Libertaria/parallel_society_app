import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ProposalService } from '@/core/types/../services/api/ProposalService';
import { Proposal } from '@/core/types/Proposal';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { ethers } from 'ethers';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { signVote, VoteMessage } from '@/core/wallet/eip712';
import { useWalletStore } from '@/store/walletStore';
import { firebaseAuth } from '@/core/config/firebase';

export default function ProposalDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { walletAddress } = useWalletStore();

    const loadProposal = useCallback(async () => {
        if (!id || typeof id !== 'string') return;
        setLoading(true);
        setError(null);
        try {
            const data = await ProposalService.fetchProposalById(id);
            setProposal(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load proposal');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProposal();
    }, [loadProposal]);

    const handleVote = async (choice: 'FOR' | 'AGAINST') => {
        if (!proposal || !walletAddress) return;

        const powerRaw = proposal.userVotingPowerRaw || '0';
        const formattedPower = formatTokens(powerRaw);

        Alert.alert(
            "Confirm Vote",
            `You are about to vote ${choice} with ${formattedPower} voting power (based on snapshot block ${proposal.snapshotBlock || 'latest'}).`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        setVoting(true);
                        try {
                            // Retrieve private key from secure storage
                            const privateKey = await SecureStorage.getEncryptedKey('private_key');
                            if (!privateKey) {
                                throw new Error('Private key not found. Please re-import your wallet.');
                            }

                            // Get authenticated user's UID (should be the wallet address)
                            const user = firebaseAuth.currentUser;
                            const authenticatedUID = user?.uid;

                            console.log('[Frontend] ========== VOTE DEBUG ==========');
                            console.log('[Frontend] Authenticated UID:', authenticatedUID);
                            console.log('[Frontend] Wallet Address from store:', walletAddress);
                            console.log('[Frontend] Wallet Address (lowercase):', walletAddress?.toLowerCase());

                            // Build vote message
                            const timestamp = Math.floor(Date.now() / 1000);
                            const voteMessage: VoteMessage = {
                                proposalId: proposal.id,
                                voter: walletAddress.toLowerCase(),
                                choice,
                                snapshotBlock: proposal.snapshotBlock || 0,
                                timestamp
                            };

                            console.log('[Frontend] Vote message:', JSON.stringify(voteMessage, null, 2));

                            // Sign the vote
                            const signature = await signVote(privateKey, voteMessage);
                            console.log('[Frontend] Signature:', signature.substring(0, 20) + '...');

                            // Submit vote with signature
                            await ProposalService.vote(proposal.id, choice, signature, timestamp);
                            Alert.alert('Success', 'Vote cast successfully');
                            loadProposal();
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to cast vote');
                        } finally {
                            setVoting(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (error || !proposal) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error || 'Proposal not found'}</Text>
                <TouchableOpacity onPress={loadProposal} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Calculations
    // Use BigInt for raw string arithmetic
    const totalFor = BigInt(proposal.totalForRaw || '0');
    const totalAgainst = BigInt(proposal.totalAgainstRaw || '0');
    const totalVotes = totalFor + totalAgainst;

    // Percentages (avoid division by zero)
    const pctFor = totalVotes > 0n ? Number((totalFor * 10000n) / totalVotes) / 100 : 0;
    const pctAgainst = totalVotes > 0n ? Number((totalAgainst * 10000n) / totalVotes) / 100 : 0;

    // Formatting tokens (assuming 18 decimals for LUT - normally fetched from config or env)
    // Using simple formatUnits for display
    const formatTokens = (raw: string) => {
        try {
            const val = parseFloat(ethers.formatUnits(raw, 18));
            return val.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' LUT';
        } catch (e) {
            return '0 LUT';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return styles.statusActive;
            case 'PASSED': return styles.statusPassed;
            case 'FAILED': return styles.statusFailed;
            case 'UPCOMING': return styles.statusUpcoming;
            default: return styles.statusClosed;
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return styles.statusTextActive;
            case 'PASSED': return styles.statusTextPassed;
            case 'FAILED': return styles.statusTextFailed;
            case 'UPCOMING': return styles.statusTextUpcoming;
            default: return styles.statusTextClosed;
        }
    };

    const isVotingClosed = ['CLOSED', 'PASSED', 'FAILED'].includes(proposal.status);

    const shortenAddress = (addr: string) => {
        if (!addr) return '';
        if (addr.length < 15) return addr;
        return `${addr.substring(0, 10)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Stack.Screen options={{ title: 'Proposal Details' }} />

            <View style={styles.header}>
                <View style={styles.badgesRow}>
                    <View style={[styles.statusBadge, getStatusColor(proposal.status)]}>
                        <Text style={[styles.statusText, getStatusTextColor(proposal.status)]}>
                            {proposal.status}
                        </Text>
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{proposal.category}</Text>
                    </View>
                </View>
                <Text style={styles.dateText}>
                    Created {new Date(proposal.createdAt).toLocaleDateString()}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <Text style={[styles.title, { marginBottom: 0 }]}>{proposal.title}</Text>
                {proposal.proposalCid && (
                    <TouchableOpacity onPress={() => Linking.openURL(`https://ipfs.filebase.io/ipfs/${proposal.proposalCid}`)}>
                        <Ionicons name="open-outline" size={18} color="#007AFF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.authorRow}>
                <Text style={styles.authorLabel}>Proposed by</Text>
                <Text style={styles.authorAddress}>
                    {shortenAddress(proposal.authorAddress)}
                </Text>
            </View>

            {/* Snapshot Info */}
            {proposal.snapshotBlock && (
                <View style={styles.snapshotContainer}>
                    <Ionicons name="camera-outline" size={16} color="#666" />
                    <Text style={styles.snapshotText}>
                        Snapshot Block: <Text style={styles.snapshotValue}>{proposal.snapshotBlock}</Text>
                    </Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <View style={styles.markdownBox}>
                    <Markdown style={markdownStyles}>
                        {proposal.description}
                    </Markdown>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Results</Text>

                {/* FOR Bar */}
                <View style={styles.resultRow}>
                    <View style={styles.resultLabelRow}>
                        <Text style={styles.resultLabel}>For</Text>
                        <Text style={styles.resultValue}>{formatTokens(proposal.totalForRaw)} ({pctFor.toFixed(2)}%)</Text>
                    </View>
                    <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${pctFor}%`, backgroundColor: '#1e7e34' }]} />
                    </View>
                </View>

                {/* AGAINST Bar */}
                <View style={styles.resultRow}>
                    <View style={styles.resultLabelRow}>
                        <Text style={styles.resultLabel}>Against</Text>
                        <Text style={styles.resultValue}>{formatTokens(proposal.totalAgainstRaw)} ({pctAgainst.toFixed(2)}%)</Text>
                    </View>
                    <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${pctAgainst}%`, backgroundColor: '#dc3545' }]} />
                    </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    {proposal.resultsCid ? (
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => Linking.openURL(`https://ipfs.filebase.io/ipfs/${proposal.resultsCid}`)}
                        >
                            <Text style={{ fontSize: 12, color: '#007AFF', fontWeight: '500' }}>Results</Text>
                            <Ionicons name="open-outline" size={14} color="#007AFF" />
                        </TouchableOpacity>
                    ) : <View />}
                    <Text style={styles.totalVoters}>
                        Total Voters: {proposal.totalVoters}
                    </Text>
                </View>
            </View>

            {/* My Vote & Power */}
            <View style={styles.myVoteContainer}>
                {proposal.myVote ? (
                    <>
                        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                        <Text style={styles.myVoteText}>
                            You voted <Text style={{ fontWeight: '700' }}>{proposal.myVote.choice}</Text> with {formatTokens(proposal.myVote.weightRaw)}
                        </Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.myVoteText}>
                            Your voting power for this proposal: <Text style={{ fontWeight: '700' }}>{formatTokens(proposal.userVotingPowerRaw || '0')}</Text>
                        </Text>
                    </>
                )}
            </View>

            {/* Voting Actions */}
            {!isVotingClosed && (
                <View style={styles.voteActions}>
                    <TouchableOpacity
                        style={[styles.voteButton, styles.voteButtonFor, voting && styles.voteButtonDisabled]}
                        onPress={() => handleVote('FOR')}
                        disabled={voting}
                    >
                        <Text style={styles.voteButtonText}>Vote For</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.voteButton, styles.voteButtonAgainst, voting && styles.voteButtonDisabled]}
                        onPress={() => handleVote('AGAINST')}
                        disabled={voting}
                    >
                        <Text style={styles.voteButtonText}>Vote Against</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { padding: 20, paddingBottom: 40 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#dc3545', marginBottom: 12 },
    retryButton: { padding: 10, backgroundColor: '#007AFF', borderRadius: 8 },
    retryText: { color: '#fff' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badgesRow: { flexDirection: 'row', gap: 8 },
    dateText: { fontSize: 12, color: '#999' },

    title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },

    authorRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
    authorLabel: { color: '#666' },
    authorAddress: { color: '#007AFF', fontFamily: 'monospace' },

    snapshotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#e9ecef',
        padding: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 20
    },
    snapshotText: { fontSize: 13, color: '#495057' },
    snapshotValue: { fontWeight: '700', fontFamily: 'monospace' },

    section: { marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },

    markdownBox: { minHeight: 60 },

    resultRow: { marginBottom: 16 },
    resultLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    resultLabel: { fontWeight: '600', color: '#333' },
    resultValue: { color: '#666', fontSize: 13 },
    barBackground: { height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    totalVoters: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 4 },

    myVoteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#e7f5ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#007AFF20'
    },
    myVoteText: { color: '#004085', fontSize: 14 },

    voteActions: { flexDirection: 'row', gap: 12 },
    voteButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    voteButtonFor: { backgroundColor: '#1e7e34' },
    voteButtonAgainst: { backgroundColor: '#dc3545' },
    voteButtonDisabled: { opacity: 0.6 },
    voteButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Status Styles (copied from index based on provided code)
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusActive: { backgroundColor: '#e6f4ea' },
    statusPassed: { backgroundColor: '#d1e7dd' },
    statusFailed: { backgroundColor: '#f8d7da' },
    statusUpcoming: { backgroundColor: '#e2e3e5' },
    statusClosed: { backgroundColor: '#f0f0f0' },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    statusTextActive: { color: '#1e7e34' },
    statusTextPassed: { color: '#0f5132' },
    statusTextFailed: { color: '#842029' },
    statusTextUpcoming: { color: '#41464b' },
    statusTextClosed: { color: '#666' },

    categoryBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    categoryText: { fontSize: 12, color: '#555', fontWeight: '500' },
});

const markdownStyles = {
    body: { fontSize: 15, color: '#333', lineHeight: 24 },
};
