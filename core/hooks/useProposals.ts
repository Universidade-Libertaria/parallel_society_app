import { useState, useEffect, useCallback } from 'react';
import { Proposal } from '../types/Proposal';
import { ProposalService } from '../services/api/ProposalService';

export interface UseProposalsHook {
    proposals: Proposal[];
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
    add: (title: string, category: string, description: string, endTime: number, authorAddress: string) => Promise<boolean>;
}

export function useProposals(): UseProposalsHook {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ProposalService.fetchProposals();
            setProposals(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load proposals');
        } finally {
            setLoading(false);
        }
    }, []);

    const add = useCallback(async (title: string, category: string, description: string, endTime: number, authorAddress: string) => {
        try {
            await ProposalService.createProposal(title, category, description, endTime);
            await load(); // Refresh the list
            return true;
        } catch (err) {
            console.error('Error adding proposal:', err);
            throw err;
        }
    }, [load]);

    // Initial load
    useEffect(() => {
        load();
    }, [load]);

    return {
        proposals,
        loading,
        error,
        load,
        add
    };
}
