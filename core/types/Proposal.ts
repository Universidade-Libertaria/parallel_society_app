
export interface Proposal {
    id: string;
    title: string;
    category: string;
    description: string;
    authorAddress: string;
    createdAt: number;
    startTime: number;
    endTime: number;
    status: 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'PASSED' | 'FAILED';

    // Snapshot strategy
    snapshotBlock?: number;
    snapshotChainId?: number;
    strategy?: string;

    // Tally in raw strings
    totalForRaw: string;
    totalAgainstRaw: string;
    tokenPowerVotedRaw: string;

    totalVoters: number;
    finalizedAt?: number;
    userVotingPowerRaw?: string;
    myVote?: {
        choice: 'FOR' | 'AGAINST';
        weightRaw: string;
    } | null;
}

export interface Vote {
    proposalId: string;
    voterAddress: string;
    choice: 'FOR' | 'AGAINST';
    weightRaw: string;
    createdAt: number;
    updatedAt: number;
}

export type ProposalCategory = 'Treasury' | 'Infrastructure' | 'Legal' | 'Other';

export const PROPOSAL_CATEGORIES: ProposalCategory[] = ['Treasury', 'Infrastructure', 'Legal', 'Other'];
