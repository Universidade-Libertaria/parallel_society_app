import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
} from 'react-native';

interface InfoModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    description?: string;
    footerText?: string;
    buttonText?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const InfoModal: React.FC<InfoModalProps> = ({
    visible,
    onClose,
    title,
    message,
    description,
    footerText,
    buttonText = 'OK',
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            <View style={styles.handle} />

                            <Text style={styles.title}>{title}</Text>

                            <View style={styles.content}>
                                <Text style={styles.message}>{message}</Text>

                                {description && (
                                    <Text style={styles.description}>{description}</Text>
                                )}

                                {footerText && (
                                    <Text style={styles.footerText}>{footerText}</Text>
                                )}
                            </View>

                            <TouchableOpacity style={styles.button} onPress={onClose}>
                                <Text style={styles.buttonText}>{buttonText}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 24,
        textAlign: 'center',
    },
    content: {
        width: '100%',
        marginBottom: 24,
    },
    message: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 22,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    footerText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
        textAlign: 'center',
        marginTop: 8,
    },
    button: {
        backgroundColor: '#f1f8fe',
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
