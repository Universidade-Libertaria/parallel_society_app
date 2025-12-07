export interface Web3Service {
    getAddress(): string;
    getBalance(): Promise<string>;
}

export class Web3ServiceImpl implements Web3Service {
    private address: string;

    constructor(address: string) {
        this.address = address;
    }

    getAddress(): string {
        return this.address;
    }

    async getBalance(): Promise<string> {
        // Placeholder implementation
        return "0.00";
    }
}
