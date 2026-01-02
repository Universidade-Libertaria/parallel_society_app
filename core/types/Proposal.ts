
export interface Proposal {
    id: string;
    title: string;
    category: string;
    description: string;
    authorAddress: string;
    authorName?: string;
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

    // IPFS Pinned Artifacts
    proposalCid?: string | null;
    proposalCidPinnedAt?: number | null;
    proposalCidStatus?: 'pinned' | 'pending' | 'failed';

    resultsCid?: string | null;
    resultsCidPinnedAt?: number | null;
    resultsCidStatus?: 'pinned' | 'pending' | 'failed';
}

export interface Vote {
    proposalId: string;
    voterAddress: string;
    choice: 'FOR' | 'AGAINST';
    weightRaw: string;
    createdAt: number;
    updatedAt: number;
}

export type ProposalCategory = 'Finance' | 'Operations' | 'Governance' | 'Other';

export const PROPOSAL_CATEGORIES: ProposalCategory[] = ['Finance', 'Operations', 'Governance', 'Other'];
