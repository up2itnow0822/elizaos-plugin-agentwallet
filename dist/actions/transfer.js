"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferAction = void 0;
const wallet_1 = require("../providers/wallet");
exports.transferAction = {
    name: 'WALLET_TRANSFER',
    similes: ['SEND_TOKENS', 'TRANSFER_FUNDS', 'PAY', 'SEND_SOL', 'SEND_ETH', 'SEND_USDC'],
    description: 'Transfer SOL, ETH, USDC, or any ERC-20/SPL token to another address. ' +
        'Works on both EVM chains (Base, Arbitrum, Optimism) and Solana. ' +
        'Spend limit is enforced automatically.',
    validate: async (runtime, _message) => {
        return !!(runtime.getSetting('AGENTWALLET_PRIVATE_KEY') ||
            runtime.getSetting('AGENTWALLET_SOLANA_PRIVATE_KEY'));
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const sdk = await (0, wallet_1.getSDK)(runtime);
        if (!sdk) {
            callback?.({ text: "I don't have a wallet configured yet." });
            return false;
        }
        const params = parseTransferIntent(message.content.text ?? '');
        if (!params) {
            callback?.({ text: 'Could not parse transfer details. Please specify: to address, amount, and token.' });
            return false;
        }
        try {
            const result = await sdk.transfer(params);
            callback?.({
                text: `Sent ${params.amount} ${params.token} to ${params.toAddress}. Tx: ${result.txHash}`,
                content: { success: true, txHash: result.txHash, params },
            });
            return true;
        }
        catch (err) {
            const msg = err.message;
            callback?.({ text: `Transfer failed: ${msg}` });
            return false;
        }
    },
    examples: [
        [
            {
                user: '{{user1}}',
                content: { text: 'Send 0.1 SOL to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
            },
            {
                user: '{{agentName}}',
                content: {
                    text: 'Sent 0.1 SOL to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU. Tx: abc123...',
                    action: 'WALLET_TRANSFER',
                },
            },
        ],
        [
            {
                user: '{{user1}}',
                content: { text: 'Transfer 50 USDC to 0x742d35Cc6634C0532925a3b8D4C9C6Fb93' },
            },
            {
                user: '{{agentName}}',
                content: {
                    text: 'Sent 50 USDC to 0x742d35Cc6634C0532925a3b8D4C9C6Fb93. Tx: 0xabc...',
                    action: 'WALLET_TRANSFER',
                },
            },
        ],
    ],
};
// ── Simple NLP parser ─────────────────────────────────────────────────────────
function parseTransferIntent(text) {
    const match = text.match(/(?:send|transfer|pay)\s+([\d.]+)\s+(\w+)\s+to\s+([\w.]+)/i);
    if (!match)
        return null;
    return { amount: match[1], token: match[2].toUpperCase(), toAddress: match[3] };
}
