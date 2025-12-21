import { firebaseAuth as auth } from '../../config/firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_AUTH_BACKEND_URL;

import { Proposal } from '../../types/Proposal';

export const ProposalService = {
    async fetchProposals(): Promise<Proposal[]> {
        const response = await fetch(`${BACKEND_URL}/listProposals`);
        if (!response.ok) {
            throw new Error('Failed to fetch proposals');
        }
        return response.json();
    },

    async fetchProposalById(id: string): Promise<Proposal> {
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : null;

        const response = await fetch(`${BACKEND_URL}/getProposal?id=${id}`, {
            headers: idToken ? {
                'Authorization': `Bearer ${idToken}`
            } : {}
        });
        if (!response.ok) {
            throw new Error('Failed to fetch proposal details');
        }
        return response.json();
    },

    async vote(proposalId: string, choice: 'FOR' | 'AGAINST'): Promise<any> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to vote');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/voteOnProposal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                id: proposalId,
                choice
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to cast vote';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
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
    },

    async deleteProposal(id: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to delete a proposal');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/deleteProposal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ id })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to delete proposal';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
    }
};
