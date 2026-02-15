import { PublicKey } from "@solana/web3.js"

/** NeuroGrid Multi-sig Treasury Vault (Solana). Receives 5% protocol fee on every Deploy. */
const TREASURY_WALLET_ADDRESS_STR =
  process.env.NEXT_PUBLIC_TREASURY_WALLET ?? "AmKdMDFTYRXUHPxcXjvJxMM1xZeAmR6rmeNj2t2cWH3h"

export const TREASURY_WALLET_ADDRESS = new PublicKey(TREASURY_WALLET_ADDRESS_STR)

/** Solana Mainnet USDT mint — 95/5 SPL token split (miner 95%, treasury 5%). */
const USDT_MINT_ADDRESS_STR = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"

export const USDT_MINT_ADDRESS = new PublicKey(USDT_MINT_ADDRESS_STR)

/** USDT uses 6 decimals on Solana. Use Math.floor(X * 10^6) for raw amounts. */
export const USDT_DECIMALS = 6
