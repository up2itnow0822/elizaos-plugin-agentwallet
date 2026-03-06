"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletProvider = void 0;
exports.getSDK = getSDK;
/**
 * WalletProvider — surfaces wallet state (address, balances, spend limit) into the
 * agent's context window so it can reason about its own funds before taking action.
 */
exports.walletProvider = {
    get: async (runtime, _message, _state) => {
        try {
            const sdk = await getSDK(runtime);
            if (!sdk) {
                return 'Wallet: not configured. Set AGENTWALLET_PRIVATE_KEY and AGENTWALLET_CHAIN in agent settings.';
            }
            const balances = await sdk.getBalances();
            const balanceLines = balances
                .map((b) => `  ${b.symbol}: ${b.balance}${b.usdValue != null ? ` ($${b.usdValue.toFixed(2)})` : ''}`)
                .join('\n');
            return [
                `## Agent Wallet`,
                `Address: ${sdk.getAddress()}`,
                `Network: ${sdk.getNetwork()}`,
                `Balances:\n${balanceLines || '  (none)'}`,
                `Last updated: ${new Date().toISOString()}`,
            ]
                .filter(Boolean)
                .join('\n');
        }
        catch (err) {
            return `Wallet: error fetching state — ${err.message}`;
        }
    },
};
// ── SDK Factory ───────────────────────────────────────────────────────────────
/**
 * getSDK — builds a unified AgentWalletSDK wrapper from runtime settings.
 *
 * EVM settings:
 *   AGENTWALLET_PRIVATE_KEY      — 0x-prefixed hex private key
 *   AGENTWALLET_ACCOUNT_ADDRESS  — AgentAccountV2 contract address (0x...)
 *   AGENTWALLET_CHAIN            — 'base' | 'arbitrum' | 'optimism' | 'ethereum' | 'polygon'
 *   AGENTWALLET_RPC_URL          — optional RPC override
 *
 * Solana settings:
 *   AGENTWALLET_SOLANA_PRIVATE_KEY — base58-encoded private key
 *   AGENTWALLET_SOLANA_NETWORK     — 'mainnet-beta' | 'devnet'
 *   AGENTWALLET_SOLANA_RPC_URL     — optional RPC override
 */
async function getSDK(runtime) {
    const evmPrivateKey = runtime.getSetting('AGENTWALLET_PRIVATE_KEY');
    const solanaPrivateKey = runtime.getSetting('AGENTWALLET_SOLANA_PRIVATE_KEY');
    if (!evmPrivateKey && !solanaPrivateKey)
        return null;
    // Dynamic import so the plugin won't crash when SDK is absent (mocked in tests)
    const sdkModule = await Promise.resolve().then(() => __importStar(require('agentwallet-sdk')));
    let evmWalletObj = null;
    let evmWalletClient = null;
    let solanaWalletObj = null;
    // ── EVM wallet setup ──────────────────────────────────────────────────────
    if (evmPrivateKey) {
        const accountAddress = runtime.getSetting('AGENTWALLET_ACCOUNT_ADDRESS');
        const chain = (runtime.getSetting('AGENTWALLET_CHAIN') ?? 'base');
        const rpcUrl = runtime.getSetting('AGENTWALLET_RPC_URL') ?? undefined;
        if (accountAddress) {
            const { createWalletClient, http } = await Promise.resolve().then(() => __importStar(require('viem')));
            const { privateKeyToAccount } = await Promise.resolve().then(() => __importStar(require('viem/accounts')));
            const { base, baseSepolia, mainnet, arbitrum, optimism, polygon } = await Promise.resolve().then(() => __importStar(require('viem/chains')));
            const CHAINS = {
                base,
                'base-sepolia': baseSepolia,
                ethereum: mainnet,
                arbitrum,
                optimism,
                polygon,
            };
            const viemChain = CHAINS[chain] ?? base;
            const account = privateKeyToAccount(evmPrivateKey);
            evmWalletClient = createWalletClient({
                account,
                chain: viemChain,
                transport: http(rpcUrl),
            });
            evmWalletObj = sdkModule.createWallet({
                accountAddress: accountAddress,
                chain,
                rpcUrl,
                walletClient: evmWalletClient,
            });
        }
    }
    // ── Solana wallet setup ───────────────────────────────────────────────────
    if (solanaPrivateKey) {
        const network = runtime.getSetting('AGENTWALLET_SOLANA_NETWORK') ?? 'mainnet-beta';
        const solanaRpc = runtime.getSetting('AGENTWALLET_SOLANA_RPC_URL') ??
            (network === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com');
        solanaWalletObj = new sdkModule.SolanaWallet({
            rpcUrl: solanaRpc,
            privateKeyBase58: solanaPrivateKey,
        });
    }
    if (!evmWalletObj && !solanaWalletObj)
        return null;
    return buildSDKWrapper(sdkModule, evmWalletObj, evmWalletClient, solanaWalletObj, runtime);
}
// ── SDK Wrapper Builder ───────────────────────────────────────────────────────
function buildSDKWrapper(sdkModule, evmWallet, evmWalletClient, solanaWallet, runtime) {
    return {
        evmWallet,
        solanaWallet,
        getAddress() {
            if (evmWallet)
                return evmWallet.address;
            if (solanaWallet)
                return solanaWallet.getPublicKey().toBase58();
            return 'unknown';
        },
        getNetwork() {
            if (evmWallet)
                return runtime.getSetting('AGENTWALLET_CHAIN') ?? 'base';
            return runtime.getSetting('AGENTWALLET_SOLANA_NETWORK') ?? 'mainnet-beta';
        },
        // ── Balances ─────────────────────────────────────────────────────────────
        async getBalances() {
            const balances = [];
            if (evmWallet) {
                try {
                    const budget = await sdkModule.checkBudget(evmWallet, sdkModule.NATIVE_TOKEN);
                    const ethBalance = Number(budget.remainingInPeriod) / 1e18;
                    balances.push({
                        symbol: 'ETH',
                        address: sdkModule.NATIVE_TOKEN,
                        balance: ethBalance.toFixed(6),
                        decimals: 18,
                    });
                }
                catch {
                    balances.push({
                        symbol: 'ETH',
                        address: '0x0000000000000000000000000000000000000000',
                        balance: '0',
                        decimals: 18,
                    });
                }
            }
            if (solanaWallet) {
                try {
                    const lamports = await solanaWallet.getBalance(); // returns bigint lamports for SOL
                    balances.push({
                        symbol: 'SOL',
                        address: 'native',
                        balance: (Number(lamports) / 1e9).toFixed(6),
                        decimals: 9,
                    });
                }
                catch {
                    balances.push({ symbol: 'SOL', address: 'native', balance: '0', decimals: 9 });
                }
            }
            return balances;
        },
        // ── Transfer ────────────────────────────────────────────────────────────
        async transfer(params) {
            const useChain = params.chain ?? (solanaWallet && !evmWallet ? 'solana' : 'evm');
            if (useChain === 'solana' && solanaWallet) {
                const signature = await solanaWallet.transfer({
                    recipient: params.toAddress,
                    amount: BigInt(Math.round(parseFloat(params.amount) * 1e9)), // SOL → lamports
                    mint: params.token === 'SOL' ? undefined : params.token,
                });
                // SolanaWallet.transfer() returns the signature string directly
                return { txHash: signature, success: true };
            }
            if (evmWallet) {
                const { encodeFunctionData, parseUnits, zeroAddress } = await Promise.resolve().then(() => __importStar(require('viem')));
                const isNative = params.token === 'ETH' ||
                    params.token === zeroAddress ||
                    params.token === '0x0000000000000000000000000000000000000000';
                let txData = '0x';
                let value = 0n;
                let to = params.toAddress;
                if (isNative) {
                    value = parseUnits(params.amount, 18);
                }
                else {
                    const erc20TransferAbi = [
                        {
                            name: 'transfer',
                            type: 'function',
                            inputs: [
                                { name: 'to', type: 'address' },
                                { name: 'amount', type: 'uint256' },
                            ],
                            outputs: [{ name: '', type: 'bool' }],
                            stateMutability: 'nonpayable',
                        },
                    ];
                    txData = encodeFunctionData({
                        abi: erc20TransferAbi,
                        functionName: 'transfer',
                        args: [params.toAddress, parseUnits(params.amount, 6)],
                    });
                    to = params.token;
                }
                const result = await sdkModule.agentExecute(evmWallet, { to, value, data: txData });
                return { txHash: result.txHash, success: true };
            }
            throw new Error('No wallet configured for the requested chain');
        },
        // ── Swap ─────────────────────────────────────────────────────────────────
        async swap(params) {
            const useChain = params.chain ?? (solanaWallet && !evmWallet ? 'solana' : 'evm');
            if (useChain === 'solana' && solanaWallet) {
                const jupiterClient = new sdkModule.JupiterSwapClient({ wallet: solanaWallet });
                const result = await jupiterClient.swap({
                    inputMint: params.fromToken,
                    outputMint: params.toToken,
                    amount: BigInt(Math.round(parseFloat(params.amount) * 1e9)),
                    slippageBps: params.slippageBps ?? 50,
                });
                return {
                    txHash: result.txSignature,
                    outputAmount: result.outputAmount.toString(),
                };
            }
            if (evmWallet) {
                const { SwapModule } = sdkModule;
                // SwapModule only supports 'base' | 'arbitrum' | 'optimism'
                const rawChain = runtime.getSetting('AGENTWALLET_CHAIN') ?? 'base';
                const evmChain = (['base', 'arbitrum', 'optimism'].includes(rawChain) ? rawChain : 'base');
                const { parseUnits } = await Promise.resolve().then(() => __importStar(require('viem')));
                const swapMod = new SwapModule(evmWallet.publicClient, evmWallet.walletClient, evmWallet.address, { chain: evmChain });
                const fromDecimals = params.fromToken.toUpperCase() === 'USDC' ? 6 : 18;
                const amountIn = parseUnits(params.amount, fromDecimals);
                const result = await swapMod.swap(params.fromToken, params.toToken, amountIn, { slippageBps: params.slippageBps ?? 50 });
                return {
                    txHash: result.txHash,
                    outputAmount: result.quote.amountOut.toString(),
                };
            }
            throw new Error('No wallet configured for swap');
        },
        // ── Bridge ───────────────────────────────────────────────────────────────
        async bridge(params) {
            const { UnifiedBridge } = sdkModule;
            const { parseUnits } = await Promise.resolve().then(() => __importStar(require('viem')));
            // UnifiedBridge.evmSigner expects a viem WalletClient (not the contract wallet wrapper)
            const bridge = new UnifiedBridge({
                evmSigner: evmWalletClient ?? undefined,
                // solanaWallet expects @solana/web3.js Keypair — not exposed from SolanaWallet class.
                // Solana-sourced bridges require a Keypair; skip for now.
            });
            const amountUsdc = parseUnits(params.amount, 6);
            const result = await bridge.bridge({
                sourceChain: params.fromChain,
                destinationChain: params.toChain,
                amount: amountUsdc,
                destinationAddress: params.toAddress ?? this.getAddress(),
            });
            return {
                sourceTxHash: result.burnTxHash,
                trackingUrl: null,
            };
        },
        // ── x402 Pay ─────────────────────────────────────────────────────────────
        async x402Pay(params) {
            const { createX402Client } = sdkModule;
            if (!evmWallet)
                throw new Error('EVM wallet required for x402 payments');
            const client = createX402Client(evmWallet);
            const response = await client.fetch(params.endpoint);
            const contentType = response.headers.get('content-type') ?? undefined;
            const amountPaid = response.headers.get('x-payment-amount') ?? params.maxAmountUsd;
            return {
                amountPaid,
                httpStatus: response.status,
                contentType,
            };
        },
    };
}
