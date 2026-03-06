"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceAction = void 0;
const wallet_1 = require("../providers/wallet");
exports.balanceAction = {
    name: 'WALLET_BALANCE',
    similes: ['CHECK_BALANCE', 'GET_BALANCE', 'WALLET_STATUS', 'HOW_MUCH_DO_I_HAVE'],
    description: 'Check the current token balances in the agent wallet. ' +
        'Returns all token balances with USD estimates.',
    validate: async (runtime, _message) => {
        return !!(runtime.getSetting('AGENTWALLET_PRIVATE_KEY') ||
            runtime.getSetting('AGENTWALLET_SOLANA_PRIVATE_KEY'));
    },
    handler: async (runtime, _message, _state, _options, callback) => {
        const sdk = await (0, wallet_1.getSDK)(runtime);
        if (!sdk) {
            callback?.({ text: 'No wallet configured.' });
            return false;
        }
        try {
            const balances = await sdk.getBalances();
            const lines = balances.map((b) => `${b.symbol}: ${b.balance}${b.usdValue != null ? ` (~$${b.usdValue.toFixed(2)})` : ''}`);
            callback?.({
                text: lines.length
                    ? `Wallet balances on ${sdk.getNetwork()}:\n${lines.join('\n')}`
                    : 'Wallet is empty.',
                content: { balances, address: sdk.getAddress() },
            });
            return true;
        }
        catch (err) {
            callback?.({ text: `Failed to fetch balances: ${err.message}` });
            return false;
        }
    },
    examples: [
        [
            { user: '{{user1}}', content: { text: 'What is my wallet balance?' } },
            {
                user: '{{agentName}}',
                content: {
                    text: 'Wallet balances on base:\nETH: 0.5 (~$1200.00)\nUSDC: 250.00 (~$250.00)',
                    action: 'WALLET_BALANCE',
                },
            },
        ],
    ],
};
