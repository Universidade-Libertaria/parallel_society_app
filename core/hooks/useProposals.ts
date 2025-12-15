import { useState, useEffect, useCallback } from 'react';
import { Proposal } from '../types/Proposal';
import { governanceService } from '../services/GovernanceService';

export interface UseProposalsHook {
    proposals: Proposal[];
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
    add: (title: string, category: string, description: string, endDate: number, author: string) => Promise<boolean>;
}

export function useProposals(): UseProposalsHook {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await governanceService.loadProposals();
            setProposals(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load proposals');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        load();
    }, [load]);

    const add = useCallback(async (title: string, category: string, description: string, endDate: number, author: string): Promise<boolean> => {
        setLoading(true);
        try {
            await governanceService.addProposal(title, category, description, endDate, author);
            await load(); // Reload list after adding
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create proposal');
            setLoading(false);
            return false;
        }
    }, [load]);

    return {
        proposals,
        loading,
        error,
        load,
        add
    };
}
