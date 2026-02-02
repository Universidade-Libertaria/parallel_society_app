import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { ProposalUpdate } from '@/core/types/Proposal';
import { ProposalUpdateService } from '@/core/services/api/ProposalUpdateService';

interface ProposalUpdatesListProps {
    proposalId: string;
    onRefresh?: () => void;
}

export function ProposalUpdatesList({ proposalId, onRefresh }: ProposalUpdatesListProps) {
    const [updates, setUpdates] = useState<ProposalUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUpdates = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ProposalUpdateService.fetchProposalUpdates(proposalId);
            setUpdates(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load updates');
            console.error('[ProposalUpdatesList] Error loading updates:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUpdates();
    }, [proposalId]);

    useEffect(() => {
        if (onRefresh) {
            loadUpdates();
        }
    }, [onRefresh]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return '#28a745';
            case 'In Progress': return '#f59e0b';
            case 'Planning': return '#3b82f6';
            case 'Delayed': return '#ef4444';
            case 'Started': return '#10b981';
            default: return '#6c757d';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed': return 'checkmark-circle';
            case 'In Progress': return 'time';
            case 'Planning': return 'clipboard';
            case 'Delayed': return 'alert-circle';
            case 'Started': return 'flag';
            default: return 'information-circle';
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading updates...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadUpdates} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (updates.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No implementation updates yet</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Implementation Updates</Text>
            
            <View style={styles.timeline}>
                {updates.map((update, index) => (
                    <View key={update.id} style={styles.updateCard}>
                        {/* Timeline connector */}
                        <View style={styles.timelineConnector}>
                            <View 
                                style={[
                                    styles.timelineDot, 
                                    { backgroundColor: getStatusColor(update.status) }
                                ]} 
                            >
                                <Ionicons 
                                    name={getStatusIcon(update.status) as any} 
                                    size={16} 
                                    color="#fff" 
                                />
                            </View>
                            {index < updates.length - 1 && <View style={styles.timelineLine} />}
                        </View>

                        {/* Update content */}
                        <View style={styles.updateContent}>
                            <View style={styles.updateHeader}>
                                <View style={styles.headerLeft}>
                                    <Ionicons 
                                        name="calendar-outline" 
                                        size={14} 
                                        color="#666" 
                                    />
                                    <Text style={styles.dateText}>{formatDate(update.createdAt)}</Text>
                                </View>
                                <View 
                                    style={[
                                        styles.statusBadge, 
                                        { backgroundColor: getStatusColor(update.status) + '20' }
                                    ]}
                                >
                                    <Text 
                                        style={[
                                            styles.statusText, 
                                            { color: getStatusColor(update.status) }
                                        ]}
                                    >
                                        {update.status}
                                    </Text>
                                </View>
                            </View>

                            {/* Update body */}
                            <View style={styles.updateBody}>
                                <Markdown style={markdownStyles}>
                                    {update.content}
                                </Markdown>
                            </View>

                            {/* Attachments */}
                            {update.attachments && update.attachments.length > 0 && (
                                <View style={styles.attachmentsContainer}>
                                    <Ionicons name="attach" size={16} color="#666" />
                                    {update.attachments.map((attachment) => (
                                        <TouchableOpacity
                                            key={attachment.id}
                                            style={styles.attachmentItem}
                                            onPress={() => Linking.openURL(attachment.url)}
                                        >
                                            <Ionicons 
                                                name={
                                                    attachment.type === 'document' ? 'document-text' :
                                                    attachment.type === 'image' ? 'image' :
                                                    'link'
                                                } 
                                                size={16} 
                                                color="#007AFF" 
                                            />
                                            <Text style={styles.attachmentName}>{attachment.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Author */}
                            <Text style={styles.authorText}>
                                Posted by: <Text style={styles.authorName}>@{update.authorName || update.authorAddress.substring(0, 8)}</Text>
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 8,
    },
    loadingText: {
        color: '#666',
        fontSize: 14,
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#dc3545',
        marginBottom: 12,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#999',
        marginTop: 12,
        fontSize: 14,
    },
    timeline: {
        paddingLeft: 8,
    },
    updateCard: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    timelineConnector: {
        alignItems: 'center',
        marginRight: 12,
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#e0e0e0',
        marginTop: 8,
        minHeight: 40,
    },
    updateContent: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    updateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    updateBody: {
        marginBottom: 12,
    },
    attachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    attachmentName: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    authorText: {
        fontSize: 12,
        color: '#999',
    },
    authorName: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

const markdownStyles = {
    body: { 
        fontSize: 14, 
        color: '#333', 
        lineHeight: 20 
    },
    bullet_list: {
        marginVertical: 4,
    },
    list_item: {
        marginVertical: 2,
    },
};
