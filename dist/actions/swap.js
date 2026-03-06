"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapAction = void 0;
const wallet_1 = require("../providers/wallet");
exports.swapAction = {
    name: 'WALLET_SWAP',
    similes: ['SWAP_TOKENS', 'EXCHANGE_TOKENS', 'TRADE_TOKENS', 'JUPITER_SWAP', 'UNISWAP'],
    description: 'Swap tokens using Jupiter (Solana) or Uniswap V3 (EVM). ' +
        'The agent holds its own keys — no custodial intermediary. ' +
        'Slippage defaults to 0.5% but can be specified.',
    validate: async (runtime, _message) => {
        return !!(runtime.getSetting('AGENTWALLET_PRIVATE_KEY') ||
            runtime.getSetting('AGENTWALLET_SOLANA_PRIVATE_KEY'));
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const sdk = await (0, wallet_1.getSDK)(runtime);
        if (!sdk) {
            callback?.({ text: 'No wallet configured for swaps.' });
            return false;
        }
        const params = parseSwapIntent(message.content.text ?? '');
        if (!params) {
            callback?.({ text: 'Could not parse swap details. Format: "swap <amount> <FROM> to <TO>"' });
            return false;
        }
        try {
            const result = await sdk.swap(params);
            callback?.({
                text: `Swapped ${params.amount} ${params.fromToken} → ${params.toToken}. Got: ${result.outputAmount}. Tx: ${result.txHash}`,
                content: { success: true, ...result, params },
            });
            return true;
        }
        catch (err) {
            callback?.({ text: `Swap failed: ${err.message}` });
            return false;
        }
    },
    examples: [
        [
            { user: '{{user1}}', content: { text: 'Swap 0.5 SOL to USDC' } },
            {
                user: '{{agentName}}',
                content: {
                    text: 'Swapped 0.5 SOL → USDC. Got: 48.32 USDC. Tx: abc...',
                    action: 'WALLET_SWAP',
                },
            },
        ],
        [
            { user: '{{user1}}', content: { text: 'swap 100 USDC to ETH' } },
            {
                user: '{{agentName}}',
                content: {
                    text: 'Swapped 100 USDC → ETH. Got: 0.0416 ETH. Tx: 0xabc...',
                    action: 'WALLET_SWAP',
                },
            },
        ],
    ],
};
function parseSwapIntent(text) {
    const match = text.match(/swap\s+([\d.]+)\s+(\w+)\s+(?:to|for)\s+(\w+)/i);
    if (!match)
        return null;
    return { amount: match[1], fromToken: match[2].toUpperCase(), toToken: match[3].toUpperCase() };
}
