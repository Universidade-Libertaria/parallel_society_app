
export interface Proposal {
    id: string;
    title: string;
    category: string;
    description: string;
    createdAt: number;
    endDate: number;
    author: string;
}

export type ProposalCategory = 'Treasury' | 'Infrastructure' | 'Legal' | 'Other';

export const PROPOSAL_CATEGORIES: ProposalCategory[] = ['Treasury', 'Infrastructure', 'Legal', 'Other'];
