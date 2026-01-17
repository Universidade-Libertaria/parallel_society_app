import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProposalUpdateStatus, ProposalUpdateAttachment, PROPOSAL_UPDATE_STATUSES } from '@/core/types/Proposal';
import { ProposalUpdateService } from '@/core/services/api/ProposalUpdateService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface AddProposalUpdateModalProps {
    visible: boolean;
    onClose: () => void;
    proposalId: string;
    onSuccess?: () => void;
}

export function AddProposalUpdateModal({ visible, onClose, proposalId, onSuccess }: AddProposalUpdateModalProps) {
    const [selectedStatus, setSelectedStatus] = useState<ProposalUpdateStatus>('In Progress');
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<ProposalUpdateAttachment[]>([]);
    const [loading, setLoading] = useState(false);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                const newAttachment: ProposalUpdateAttachment = {
                    id: Date.now().toString(),
                    name: file.name,
                    type: 'document',
                    url: file.uri,
                    size: file.size,
                };
                setAttachments([...attachments, newAttachment]);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const image = result.assets[0];
                const newAttachment: ProposalUpdateAttachment = {
                    id: Date.now().toString(),
                    name: `image_${Date.now()}.jpg`,
                    type: 'image',
                    url: image.uri,
                };
                setAttachments([...attachments, newAttachment]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleAddLink = () => {
        Alert.prompt(
            'Add Link',
            'Enter the URL and display name',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Add',
                    onPress: (url?: string) => {
                        if (url && url.trim()) {
                            const newAttachment: ProposalUpdateAttachment = {
                                id: Date.now().toString(),
                                name: url,
                                type: 'link',
                                url: url.trim(),
                            };
                            setAttachments([...attachments, newAttachment]);
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    const removeAttachment = (id: string) => {
        setAttachments(attachments.filter(a => a.id !== id));
    };

    const insertFormatting = (format: 'bold' | 'italic' | 'list' | 'link') => {
        switch (format) {
            case 'bold':
                setContent(content + '**bold text**');
                break;
            case 'italic':
                setContent(content + '*italic text*');
                break;
            case 'list':
                setContent(content + '\n- List item');
                break;
            case 'link':
                setContent(content + '[Link text](https://example.com)');
                break;
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please enter update details');
            return;
        }

        setLoading(true);
        try {
            await ProposalUpdateService.addProposalUpdate({
                proposalId,
                status: selectedStatus,
                content: content.trim(),
                attachments,
            });

            // Reset form
            setContent('');
            setSelectedStatus('In Progress');
            setAttachments([]);

            Alert.alert('Success', 'Update posted successfully');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('[AddProposalUpdateModal] Error posting update:', error);
            Alert.alert('Error', error.message || 'Failed to post update');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ProposalUpdateStatus) => {
        switch (status) {
            case 'Completed': return '#28a745';
            case 'In Progress': return '#f59e0b';
            case 'Planning': return '#6c757d';
            case 'Delayed': return '#dc3545';
            case 'Started': return '#10b981';
            default: return '#6c757d';
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Status Update</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Info banner */}
                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle" size={16} color="#666" />
                            <Text style={styles.infoText}>
                                This update will be publicly visible to all citizens.
                            </Text>
                        </View>

                        {/* Status selector */}
                        <Text style={styles.label}>Status</Text>
                        <View style={styles.statusButtons}>
                            {PROPOSAL_UPDATE_STATUSES.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.statusButton,
                                        selectedStatus === status && {
                                            backgroundColor: getStatusColor(status),
                                        },
                                    ]}
                                    onPress={() => setSelectedStatus(status)}
                                >
                                    <Text
                                        style={[
                                            styles.statusButtonText,
                                            selectedStatus === status && styles.statusButtonTextActive,
                                        ]}
                                    >
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Update details */}
                        <Text style={styles.label}>Update Details</Text>
                        <View style={styles.textInputContainer}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Share the latest progress on this proposal..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={6}
                                value={content}
                                onChangeText={setContent}
                                textAlignVertical="top"
                            />

                            {/* Formatting toolbar */}
                            <View style={styles.toolbar}>
                                <TouchableOpacity onPress={() => insertFormatting('bold')}>
                                    <Text style={styles.toolbarButton}>B</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => insertFormatting('italic')}>
                                    <Text style={[styles.toolbarButton, { fontStyle: 'italic' }]}>I</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => insertFormatting('list')}>
                                    <Ionicons name="list" size={18} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => insertFormatting('link')}>
                                    <Ionicons name="link" size={18} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Attachments */}
                        <Text style={styles.label}>Attachments</Text>
                        <TouchableOpacity
                            style={styles.attachmentPicker}
                            onPress={() => {
                                Alert.alert(
                                    'Add Attachment',
                                    'Choose attachment type',
                                    [
                                        { text: 'Document', onPress: handlePickDocument },
                                        { text: 'Image', onPress: handlePickImage },
                                        { text: 'Link', onPress: handleAddLink },
                                        { text: 'Cancel', style: 'cancel' },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="attach" size={24} color="#999" />
                            <Text style={styles.attachmentPickerText}>
                                Add attachments (documents, images, links)
                            </Text>
                        </TouchableOpacity>

                        {/* Attachment list */}
                        {attachments.map((attachment) => (
                            <View key={attachment.id} style={styles.attachmentItem}>
                                <Ionicons
                                    name={
                                        attachment.type === 'document' ? 'document-text' :
                                        attachment.type === 'image' ? 'image' :
                                        'link'
                                    }
                                    size={20}
                                    color="#007AFF"
                                />
                                <Text style={styles.attachmentName} numberOfLines={1}>
                                    {attachment.name}
                                </Text>
                                <TouchableOpacity onPress={() => removeAttachment(attachment.id)}>
                                    <Ionicons name="close-circle" size={20} color="#dc3545" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Submit button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Post Update</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        paddingHorizontal: 20,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    statusButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    statusButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    statusButtonText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    statusButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    textInputContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
    },
    textArea: {
        padding: 16,
        fontSize: 15,
        minHeight: 120,
        color: '#333',
    },
    toolbar: {
        flexDirection: 'row',
        gap: 16,
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fafafa',
    },
    toolbarButton: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
    },
    attachmentPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#ddd',
        borderRadius: 12,
        marginBottom: 12,
    },
    attachmentPickerText: {
        flex: 1,
        fontSize: 14,
        color: '#999',
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 8,
    },
    attachmentName: {
        flex: 1,
        fontSize: 13,
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        marginHorizontal: 20,
        marginTop: 16,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
