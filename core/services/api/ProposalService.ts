import { firebaseAuth as auth } from '../../config/firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_AUTH_BACKEND_URL;

export interface Proposal {
    id: string;
    title: string;
    category: string;
    authorAddress: string;
    createdAt: any;
    startTime: any;
    endTime: any;
    status: 'ACTIVE' | 'CLOSED';
    totalFor: number;
    totalAgainst: number;
    description: string;
}

export const ProposalService = {
    async fetchProposals(): Promise<Proposal[]> {
        const response = await fetch(`${BACKEND_URL}/listProposals`);
        if (!response.ok) {
            throw new Error('Failed to fetch proposals');
        }
        return response.json();
    },

    async fetchProposalById(id: string): Promise<Proposal> {
        const response = await fetch(`${BACKEND_URL}/getProposal?id=${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch proposal details');
        }
        return response.json();
    },

    async createProposal(title: string, category: string, description: string, endTime?: number): Promise<Proposal> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to create a proposal');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/createProposal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                title,
                category,
                description,
                endTime
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to create proposal';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }
};
