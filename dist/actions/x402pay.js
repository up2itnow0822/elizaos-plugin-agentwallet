"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.x402PayAction = void 0;
const wallet_1 = require("../providers/wallet");
exports.x402PayAction = {
    name: 'X402_PAY',
    similes: ['PAY_API', 'MICROPAYMENT', 'PAY_ENDPOINT', 'X402_REQUEST'],
    description: 'Pay for a resource or API endpoint using the x402 micropayment protocol. ' +
        'Works with any HTTP endpoint that returns a 402 Payment Required status. ' +
        'Sub-cent payments on EVM chains with automatic payment handling.',
    validate: async (runtime, _message) => {
        return !!runtime.getSetting('AGENTWALLET_PRIVATE_KEY');
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const sdk = await (0, wallet_1.getSDK)(runtime);
        if (!sdk) {
            callback?.({ text: 'No wallet configured for x402 payments.' });
            return false;
        }
        const params = parseX402Intent(message.content.text ?? '');
        if (!params) {
            callback?.({
                text: 'Please specify the endpoint URL and max payment amount. Example: "pay x402 endpoint https://api.example.com/data max 0.01 USDC"',
            });
            return false;
        }
        try {
            const result = await sdk.x402Pay(params);
            callback?.({
                text: `x402 payment sent — $${result.amountPaid} USDC to ${params.endpoint}. ` +
                    `Response received: ${result.httpStatus} ${result.contentType ?? ''}`,
                content: { success: true, ...result, params },
            });
            return true;
        }
        catch (err) {
            callback?.({ text: `x402 payment failed: ${err.message}` });
            return false;
        }
    },
    examples: [
        [
            {
                user: '{{user1}}',
                content: { text: 'Pay x402 endpoint https://api.weatheragent.xyz/forecast max 0.001 USDC' },
            },
            {
                user: '{{agentName}}',
                content: {
                    text: 'x402 payment sent — $0.001 USDC to https://api.weatheragent.xyz/forecast. Response: 200 application/json',
                    action: 'X402_PAY',
                },
            },
        ],
    ],
};
function parseX402Intent(text) {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    const amountMatch = text.match(/max\s+([\d.]+)/i);
    if (!urlMatch)
        return null;
    return {
        endpoint: urlMatch[0],
        maxAmountUsd: amountMatch ? amountMatch[1] : '0.01',
    };
}
