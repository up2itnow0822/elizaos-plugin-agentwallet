import type { IAgentRuntime, Provider } from '@elizaos/core';
import type { AgentWalletSDK } from '../types';
/**
 * WalletProvider — surfaces wallet state (address, balances, spend limit) into the
 * agent's context window so it can reason about its own funds before taking action.
 */
export declare const walletProvider: Provider;
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
export declare function getSDK(runtime: IAgentRuntime): Promise<AgentWalletSDK | null>;
