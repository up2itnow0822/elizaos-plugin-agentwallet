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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletProvider = exports.x402PayAction = exports.bridgeAction = exports.swapAction = exports.transferAction = exports.balanceAction = void 0;
const balance_1 = require("./actions/balance");
Object.defineProperty(exports, "balanceAction", { enumerable: true, get: function () { return balance_1.balanceAction; } });
const transfer_1 = require("./actions/transfer");
Object.defineProperty(exports, "transferAction", { enumerable: true, get: function () { return transfer_1.transferAction; } });
const swap_1 = require("./actions/swap");
Object.defineProperty(exports, "swapAction", { enumerable: true, get: function () { return swap_1.swapAction; } });
const bridge_1 = require("./actions/bridge");
Object.defineProperty(exports, "bridgeAction", { enumerable: true, get: function () { return bridge_1.bridgeAction; } });
const x402pay_1 = require("./actions/x402pay");
Object.defineProperty(exports, "x402PayAction", { enumerable: true, get: function () { return x402pay_1.x402PayAction; } });
const wallet_1 = require("./providers/wallet");
Object.defineProperty(exports, "walletProvider", { enumerable: true, get: function () { return wallet_1.walletProvider; } });
__exportStar(require("./types"), exports);
/**
 * elizaos-plugin-agentwallet
 *
 * Gives ElizaOS agents a fully non-custodial wallet with:
 *  - EVM support: Base, Arbitrum, Optimism, Ethereum
 *  - Solana support: mainnet + devnet
 *  - x402 micropayments (agent-to-agent or agent-to-API)
 *  - CCTP cross-chain bridge (17 chains, USDC)
 *  - Jupiter swaps (Solana) + Uniswap V3 (EVM)
 *  - Spend limits — cap per-tx amount so no single action drains the wallet
 *
 * Required agent settings:
 *  AGENTWALLET_PRIVATE_KEY        — private key (hex for EVM, base58 for Solana)
 *  AGENTWALLET_CHAIN              — 'evm' | 'solana'
 *  AGENTWALLET_EVM_NETWORK        — 'base' | 'arbitrum' | 'optimism' | 'ethereum' (default: base)
 *  AGENTWALLET_SOLANA_NETWORK     — 'mainnet-beta' | 'devnet' (default: mainnet-beta)
 *  AGENTWALLET_SPEND_LIMIT_USD    — max USD per transaction (default: 50)
 *  AGENTWALLET_RPC_URL            — optional custom RPC (recommended for production)
 */
const agentWalletPlugin = {
    name: 'agentwallet',
    description: 'Non-custodial wallet plugin for ElizaOS — EVM + Solana, x402 micropayments, CCTP cross-chain bridge, spend limits.',
    actions: [balance_1.balanceAction, transfer_1.transferAction, swap_1.swapAction, bridge_1.bridgeAction, x402pay_1.x402PayAction],
    providers: [wallet_1.walletProvider],
    evaluators: [],
};
exports.default = agentWalletPlugin;
