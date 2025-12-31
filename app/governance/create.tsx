import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProposalService } from '@/core/services/api/ProposalService';
import { PROPOSAL_CATEGORIES, ProposalCategory } from '@/core/types/Proposal';
import { useWalletStore } from '@/store/walletStore';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { WalletService } from '@/core/wallet/WalletService';
import { InfoModal } from '@/components/ui/InfoModal';

export default function CreateProposalScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<ProposalCategory>('Treasury');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        variant?: 'info' | 'error' | 'success' | 'warning';
        onClose: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        onClose: () => { },
    });

    const closePortal = () => setModalConfig(prev => ({ ...prev, visible: false }));

    const handlePublish = async () => {
        if (!title.trim() || !description.trim()) {
            setModalConfig({
                visible: true,
                title: 'Error',
                message: 'Title and Description are required.',
                variant: 'error',
                onClose: closePortal
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { mnemonic } = useWalletStore.getState();

            // Retrieve private key from secure storage (matches voting logic)
            const privateKey = await SecureStorage.getEncryptedKey('private_key');

            if (!privateKey) {
                throw new Error('Private key not found. Please ensure your wallet is set up.');
            }

            const { walletAddress } = useWalletStore.getState();
            const authorAddress = walletAddress || WalletService.deriveAddress(privateKey);

            console.log('[CreateProposal] Wallet ready:', { address: authorAddress, hasPrivateKey: !!privateKey });

            await ProposalService.createProposal({
                title,
                category,
                description,
                authorAddress,
                privateKey
            });

            setModalConfig({
                visible: true,
                title: 'Success',
                message: 'Proposal created and pinned to IPFS!',
                variant: 'success',
                onClose: () => {
                    closePortal();
                    router.back();
                }
            });
        } catch (error: any) {
            console.error('Failed to create proposal:', error);
            setModalConfig({
                visible: true,
                title: 'Creation Failed',
                message: error.message || 'An error occurred while creating the proposal.',
                variant: 'error',
                onClose: closePortal
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Proposal</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Brief summary of the proposal"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                    {PROPOSAL_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryOption,
                                category === cat && styles.categoryOptionSelected
                            ]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                category === cat && styles.categoryTextSelected
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Description (Markdown supported)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Explain why this proposal is important..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={10}
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity
                style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
                onPress={handlePublish}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.publishButtonText}>Publish Proposal</Text>
                )}
            </TouchableOpacity>

            <InfoModal
                visible={modalConfig.visible}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
        paddingBottom: 48,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        marginTop: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    form: {
        gap: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        minHeight: 200,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    categoryOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#eee',
    },
    categoryOptionSelected: {
        backgroundColor: '#e6f2ff',
        borderColor: '#007AFF',
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    publishButton: {
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    publishButtonDisabled: {
        backgroundColor: '#ccc',
    },
    publishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
