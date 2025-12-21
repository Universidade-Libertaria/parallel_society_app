
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
    totalFor: string;
    totalAgainst: string;
    totalVoters: number;
    tokenPowerVoted: string;
    finalizedAt?: number;
    myVote?: {
        choice: 'FOR' | 'AGAINST';
        weight: string;
    } | null;
}

export interface Vote {
    proposalId: string;
    voterAddress: string;
    choice: 'FOR' | 'AGAINST';
    weight: string;
    createdAt: number;
    updatedAt: number;
}

export type ProposalCategory = 'Treasury' | 'Infrastructure' | 'Legal' | 'Other';

export const PROPOSAL_CATEGORIES: ProposalCategory[] = ['Treasury', 'Infrastructure', 'Legal', 'Other'];
