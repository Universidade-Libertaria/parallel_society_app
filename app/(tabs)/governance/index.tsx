import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProposals } from '@/core/hooks/useProposals';
import { useLutBalance } from '@/core/hooks/useLutBalance';
import { Proposal } from '@/core/types/Proposal';
import Markdown from 'react-native-markdown-display';

export default function GovernanceScreen() {
    const router = useRouter();
    const { proposals, loading, load } = useProposals();
    const { formatted: lutBalance, canCreateProposal, refresh: refreshBalance } = useLutBalance();

    useFocusEffect(
        useCallback(() => {
            load();
            refreshBalance();
        }, [load, refreshBalance])
    );

    const onRefresh = async () => {
        await Promise.all([load(), refreshBalance()]);
    };

    const getStatus = (endDate: number) => {
        return Date.now() < endDate ? 'Open' : 'Closed';
    };

    const renderProposal = ({ item }: { item: Proposal }) => {
        const isOpen = item.status === 'ACTIVE';
        const statusLabel = isOpen ? 'Open' : 'Closed';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
                            <Text style={[styles.statusText, isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
                                {statusLabel}
                            </Text>
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                    </View>
                    <Text style={styles.dateText}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                <Text style={styles.title}>{item.title}</Text>

                <View style={styles.descriptionContainer}>
                    <Markdown style={markdownStyles}>
                        {(item.description || '').length > 200
                            ? (item.description || '').substring(0, 200) + '...'
                            : (item.description || '')}
                    </Markdown>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.authorText}>
                        by {item.authorAddress ? `${item.authorAddress.slice(0, 6)}...${item.authorAddress.slice(-4)}` : 'Unknown'}
                    </Text>
                    <Text style={styles.endDateText}>
                        Ends {new Date(item.endTime).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Balance Header */}
            <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Your Voting Power</Text>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceValue}>{lutBalance} LUT</Text>
                    {canCreateProposal ? (
                        <View style={styles.statusTagSuccess}>
                            <Text style={styles.balanceStatusText}>Eligible</Text>
                        </View>
                    ) : (
                        <View style={styles.statusTagValues}>
                            <Text style={styles.statusTextWarning}>Need 2k+</Text>
                        </View>
                    )}
                </View>
            </View>

            <FlatList
                data={proposals}
                renderItem={renderProposal}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="documents-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyStateTitle}>No proposals yet</Text>
                            <Text style={styles.emptyStateText}>
                                Be the first to create a proposal for the community.
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* FAB for Create Proposal */}
            <TouchableOpacity
                style={[
                    styles.fab,
                    !canCreateProposal && styles.fabDisabled
                ]}
                onPress={() => router.push('/governance/create')}
                disabled={!canCreateProposal}
            >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.fabText}>Create Proposal</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    balanceHeader: {
        backgroundColor: '#fff',
        padding: 16,
        paddingTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    balanceLabel: {
        fontSize: 12,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    statusTagSuccess: {
        backgroundColor: '#e6f4ea',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusTagValues: {
        backgroundColor: '#fff3cd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    balanceStatusText: {
        fontSize: 12,
        color: '#1e7e34',
        fontWeight: '600',
    },
    statusTextWarning: {
        fontSize: 12,
        color: '#856404',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // Space for FAB
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusOpen: {
        backgroundColor: '#e6f4ea',
    },
    statusClosed: {
        backgroundColor: '#f0f0f0',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statusTextOpen: {
        color: '#1e7e34',
    },
    statusTextClosed: {
        color: '#666',
    },
    categoryBadge: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },

    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        left: 24,
        backgroundColor: '#007AFF',
        borderRadius: 28,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    fabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    descriptionContainer: {
        maxHeight: 150,
        overflow: 'hidden',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    authorText: {
        fontSize: 12,
        color: '#999',
    },
    endDateText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
});

const markdownStyles = {
    body: { fontSize: 14, color: '#666' },
    heading1: { fontSize: 16, fontWeight: 'bold' as 'bold', marginVertical: 4 },
    heading2: { fontSize: 15, fontWeight: 'bold' as 'bold', marginVertical: 3 },
    paragraph: { marginVertical: 2 },
};
