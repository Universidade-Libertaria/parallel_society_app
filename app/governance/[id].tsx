import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { ProposalService } from '@/core/services/api/ProposalService';
import { Proposal } from '@/core/types/Proposal';
import { firebaseAuth } from '@/core/config/firebase';
import { useLutBalance } from '@/core/hooks/useLutBalance';
import { ethers } from 'ethers';

export default function ProposalDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const { formatted: lutBalance } = useLutBalance();

    const loadProposal = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await ProposalService.fetchProposalById(id as string);
            setProposal(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load proposal details');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        loadProposal();
    }, [loadProposal]);

    const handleVote = async (choice: 'FOR' | 'AGAINST') => {
        if (!proposal) return;

        Alert.alert(
            `Vote ${choice}`,
            `Are you sure you want to vote ${choice} for this proposal? Your current voting power is ${lutBalance} LUT.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Vote',
                    onPress: async () => {
                        setVoting(true);
                        try {
                            // Note: Public view currently uses a simplified vote call. 
                            // In a real scenario, this would also require EIP-712 signing.
                            const result = await ProposalService.vote(proposal.id, choice, '0x', Math.floor(Date.now() / 1000));
                            setProposal(result.proposal);
                            // Optimistically update myVote
                            setProposal(prev => prev ? ({
                                ...prev,
                                ...result.proposal,
                                myVote: result.myVote
                            }) : null);

                            Alert.alert('Success', 'Your vote has been recorded.');
                        } catch (error: any) {
                            Alert.alert('Vote Failed', error.message || 'An error occurred while voting.');
                        } finally {
                            setVoting(false);
                        }
                    }
                }
            ]
        );
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

    const formatTokenAmount = (amount: string) => {
        if (!amount) return '0';
        try {
            // Assuming 18 decimals, simplifed display
            const val = parseFloat(ethers.formatUnits(amount, 18));
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
            return val.toFixed(0);
        } catch (e) {
            return '0';
        }
    };

    const calculatePercentage = (part: string, total: string) => {
        try {
            const p = parseFloat(ethers.formatUnits(part || '0', 18));
            const t = parseFloat(ethers.formatUnits(total || '0', 18));
            if (t === 0) return 0;
            return Math.round((p / t) * 100);
        } catch (e) {
            return 0;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!proposal) return null;

    const percentFor = calculatePercentage(proposal.totalForRaw, proposal.tokenPowerVotedRaw);
    const percentAgainst = calculatePercentage(proposal.totalAgainstRaw, proposal.tokenPowerVotedRaw);
    const isActive = proposal.status === 'ACTIVE';

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Proposal Details', headerBackTitle: 'Governance' }} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProposal} />}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View style={styles.badgesRow}>
                        <View style={[styles.statusBadge, getStatusColor(proposal.status)]}>
                            <Text style={[styles.statusLabelText, getStatusTextColor(proposal.status)]}>{proposal.status}</Text>
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{proposal.category}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <Text style={[styles.title, { marginBottom: 0 }]}>{proposal.title}</Text>
                        {proposal.proposalCid && (
                            <TouchableOpacity onPress={() => Linking.openURL(`https://ipfs.filebase.io/ipfs/${proposal.proposalCid}`)}>
                                <Ionicons name="open-outline" size={18} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.metaRow}>
                        <Ionicons name="person-circle-outline" size={20} color="#666" />
                        <Text style={styles.metaText}>
                            {proposal.authorAddress.substring(0, 10)}...{proposal.authorAddress.substring(proposal.authorAddress.length - 4)}
                        </Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.metaText}>
                            {new Date(proposal.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Markdown style={markdownStyles}>
                        {proposal.description}
                    </Markdown>
                </View>

                {/* Voting Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current Tally</Text>

                    <View style={styles.tallyCard}>
                        <View style={styles.tallyHeader}>
                            <Text style={styles.tallyTotal}>
                                {formatTokenAmount(proposal.tokenPowerVotedRaw)} Tokens Voted
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                {proposal.resultsCid && (
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                        onPress={() => Linking.openURL(`https://ipfs.filebase.io/ipfs/${proposal.resultsCid}`)}
                                    >
                                        <Text style={{ fontSize: 13, color: '#007AFF', fontWeight: '500' }}>Results</Text>
                                        <Ionicons name="open-outline" size={14} color="#007AFF" />
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.voterCount}>{proposal.totalVoters} Voters</Text>
                            </View>
                        </View>

                        {/* For Bar */}
                        <View style={styles.barContainer}>
                            <View style={styles.barLabelRow}>
                                <Text style={styles.barLabel}>For</Text>
                                <Text style={styles.barValue}>{percentFor}%</Text>
                            </View>
                            <View style={styles.barBackground}>
                                <View style={[styles.barFill, { width: `${percentFor}%`, backgroundColor: '#198754' }]} />
                            </View>
                            <Text style={styles.barAmount}>{formatTokenAmount(proposal.totalForRaw)} LUT</Text>
                        </View>

                        {/* Against Bar */}
                        <View style={styles.barContainer}>
                            <View style={styles.barLabelRow}>
                                <Text style={styles.barLabel}>Against</Text>
                                <Text style={styles.barValue}>{percentAgainst}%</Text>
                            </View>
                            <View style={styles.barBackground}>
                                <View style={[styles.barFill, { width: `${percentAgainst}%`, backgroundColor: '#dc3545' }]} />
                            </View>
                            <Text style={styles.barAmount}>{formatTokenAmount(proposal.totalAgainstRaw)} LUT</Text>
                        </View>
                    </View>
                </View>

                {/* Vote Actions */}
                {isActive && (
                    <View style={styles.voteSection}>
                        {proposal.myVote ? (
                            <View style={styles.votedBanner}>
                                <Ionicons name="checkmark-circle" size={20} color="#198754" />
                                <Text style={styles.votedText}>
                                    You voted {proposal.myVote.choice} with {formatTokenAmount(proposal.myVote.weightRaw)} LUT
                                </Text>
                            </View>
                        ) : null}

                        <Text style={styles.voteTitle}>Cast Your Vote</Text>
                        <View style={styles.voteButtonsRow}>
                            <TouchableOpacity
                                style={[styles.voteButton, styles.voteButtonFor]}
                                onPress={() => handleVote('FOR')}
                                disabled={voting}
                            >
                                {voting ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Ionicons name="thumbs-up" size={20} color="#fff" />
                                        <Text style={styles.voteButtonText}>Vote For</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.voteButton, styles.voteButtonAgainst]}
                                onPress={() => handleVote('AGAINST')}
                                disabled={voting}
                            >
                                {voting ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Ionicons name="thumbs-down" size={20} color="#fff" />
                                        <Text style={styles.voteButtonText}>Vote Against</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.voteHint}>
                            Your vote weight is based on your balance of {lutBalance} LUT.
                        </Text>
                    </View>
                )}

                {!isActive && (
                    <View style={styles.closedBanner}>
                        <Text style={styles.closedText}>
                            Voting for this proposal has ended ({proposal.status}).
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerSection: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        lineHeight: 32,
    },
    statusLabelText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    categoryBadge: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#495057',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: '#6c757d',
        fontSize: 14,
    },
    dot: {
        color: '#adb5bd',
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        color: '#212529',
    },
    tallyCard: {
        gap: 16,
    },
    tallyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    tallyTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212529',
    },
    voterCount: {
        fontSize: 14,
        color: '#6c757d',
    },
    barContainer: {
        marginBottom: 8,
    },
    barLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    barLabel: {
        fontWeight: '500',
        color: '#495057',
    },
    barValue: {
        fontWeight: '700',
        color: '#212529',
    },
    barBackground: {
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    barAmount: {
        fontSize: 12,
        color: '#adb5bd',
        textAlign: 'right',
    },
    voteSection: {
        marginTop: 8,
    },
    voteTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    voteButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    voteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    voteButtonFor: {
        backgroundColor: '#198754',
    },
    voteButtonAgainst: {
        backgroundColor: '#dc3545',
    },
    voteButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    voteHint: {
        textAlign: 'center',
        color: '#6c757d',
        fontSize: 12,
    },
    votedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1e7dd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    votedText: {
        color: '#0f5132',
        fontWeight: '500',
        fontSize: 14,
        flex: 1,
    },
    closedBanner: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#e9ecef',
        borderRadius: 12,
    },
    closedText: {
        color: '#495057',
        fontWeight: '500',
    },

    // Status Colors
    statusActive: { backgroundColor: '#e6f4ea' },
    statusPassed: { backgroundColor: '#d1e7dd' },
    statusFailed: { backgroundColor: '#f8d7da' },
    statusUpcoming: { backgroundColor: '#e2e3e5' },
    statusClosed: { backgroundColor: '#f0f0f0' },

    statusTextActive: { color: '#1e7e34' },
    statusTextPassed: { color: '#0f5132' },
    statusTextFailed: { color: '#842029' },
    statusTextUpcoming: { color: '#41464b' },
    statusTextClosed: { color: '#666' },
});

const markdownStyles = {
    body: { fontSize: 16, color: '#495057', lineHeight: 24 },
    heading1: { fontSize: 20, fontWeight: 'bold' as 'bold', marginVertical: 8 },
    heading2: { fontSize: 18, fontWeight: 'bold' as 'bold', marginVertical: 6 },
    paragraph: { marginVertical: 8 },
};
