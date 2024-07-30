export interface BlockData {
    blockNumber: number;
    blockTimestamp: number;
}

export interface OutputDataRow {
    block_number: number;
    timestamp: number;
    user_address: string;
    token_address: string;
    token_balance: bigint;
    token_symbol: string;
    usd_price: number;
}
