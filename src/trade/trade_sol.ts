import axios from 'axios';
import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const JUPITER_API_KEY = process.env.JUPITER_API_KEY; // Optional for Ultra API
const SOL_RPC_URL = process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com';

console.log("JUPITER_API_KEY:", JUPITER_API_KEY);
// Constants
const SOL_MINT = 'So11111111111111111111111111111111111111112';
// Official Public API (Blocked in some regions)
// const JUPITER_V6_QUOTE_API = 'https://quote-api.jup.ag/v6'; 
// Alternative Public API (Hosted by QuickNode, 0.2% platform fee may apply)
const JUPITER_V6_QUOTE_API = 'https://public.jupiterapi.com'; 
// Ultra API (Using Lite endpoint per user request)
const JUPITER_ULTRA_API_BASE = 'https://lite-api.jup.ag/ultra/v1';

// Setup Connection
const connection = new Connection(SOL_RPC_URL, 'confirmed');

const createWallet = (privateKey: string) => {
    try {
        if (privateKey.includes('[')) {
            return Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));
        }
        const normalized = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
        if (/^[0-9a-fA-F]+$/.test(normalized) && normalized.length % 2 === 0) {
            return Keypair.fromSecretKey(new Uint8Array(Buffer.from(normalized, 'hex')));
        }
    } catch {
    }
    throw new Error("Invalid SOL private key format");
};

/**
 * Trade using Jupiter Ultra V3 API (Requires API Key)
 */
async function tradeUltra(inputMint: string, outputMint: string, amountLamports: string, slippageBps: number, wallet: Keypair) {
    console.log("🚀 Using Jupiter Ultra API (Lite)...");
    
    // Note: Lite API might not strictly require JUPITER_API_KEY for free tier, 
    // but we use it if present in headers or params if documented.
    // The Python snippet didn't use it, but we'll include it in headers as standard practice for Jup API.
    const headers = JUPITER_API_KEY ? { 'x-api-key': JUPITER_API_KEY } : undefined;

    // 1. Create Order (GET Transaction)
    // Reference: Python snippet uses GET request
    const orderUrl = `${JUPITER_ULTRA_API_BASE}/order`;
    const orderParams = {
        inputMint,
        outputMint,
        amount: amountLamports,
        taker: wallet.publicKey.toBase58(),
        slippageBps,
    };

    console.log(`Requesting Ultra Order from: ${orderUrl}`);
    let orderRes;
    try {
        orderRes = await axios.get(orderUrl, { 
            params: orderParams,
            headers
        });
    } catch (e: any) {
        console.error(`❌ Ultra API Request Failed. URL: ${orderUrl}`);
        if (e.response?.status === 401) {
            console.error("❌ Ultra API Authentication Failed (401). Check API Key.");
        } else if (e.response?.status === 403) {
            console.error("❌ Ultra API Access Denied (403). Check Permissions.");
        }
        throw e;
    }
    
    // Response format based on Python snippet and search results
    const { transaction: swapTransaction, requestId } = orderRes.data; 

    if (!swapTransaction) {
        throw new Error("Ultra API response missing 'transaction' field.");
    }

    // 2. Sign Transaction
    const txBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(txBuf);
    transaction.sign([wallet]);
    const signedTxBase64 = Buffer.from(transaction.serialize()).toString('base64');

    // 3. Execute Order
    const executeUrl = `${JUPITER_ULTRA_API_BASE}/execute`;
    console.log("Executing Ultra Order...");
    
    // Payload for execute: { signedTransaction, requestId }
    const executePayload = {
        signedTransaction: signedTxBase64,
        requestId 
    };

    const executeRes = await axios.post(executeUrl, executePayload, { headers }); 

    console.log(`✅ Ultra Trade Executed! Signature: ${executeRes.data.txid || executeRes.data.signature}`);
    
    const txid = executeRes.data.txid || executeRes.data.signature;
    
    // Fetch fee
    await connection.confirmTransaction(txid, 'confirmed');
    const txDetail = await connection.getTransaction(txid, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    const fee = txDetail?.meta?.fee || 0;
    const feeSOL = (fee / 1e9).toFixed(9);
    console.log(`Gas Fee: ${fee} Lamports (${feeSOL} SOL)`);

    return { hash: txid, gasFee: feeSOL };
}

/**
 * Trade using Jupiter V6 Public API (Fallback)
 */
async function tradeV6(inputMint: string, outputMint: string, amountLamports: string, slippageBps: number, wallet: Keypair) {
    console.log("🌐 Using Jupiter V6 Public API (Ultra Engine under the hood)...");

    // 1. Get Quote
    const quoteUrl = `${JUPITER_V6_QUOTE_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippageBps}`;
    console.log("Requesting Quote...");
    let quoteRes;
    try {
        quoteRes = await axios.get(quoteUrl);
    } catch (e: any) {
        if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
            console.error("❌ Connection Refused to Jupiter Public API.");
            console.error("👉 If you are in a restricted region, please use a VPN or a Proxy.");
            console.error(`   Endpoint tried: ${JUPITER_V6_QUOTE_API}`);
        } else if (e.response?.status === 404) {
             console.error(`❌ Endpoint Not Found: ${quoteUrl}`);
        }
        throw e;
    }
    const quoteResponse = quoteRes.data;
    
    console.log(`Quote received: ${quoteResponse.outAmount} out for ${amountLamports} in`);

    // 2. Get Swap Transaction
    const swapUrl = `${JUPITER_V6_QUOTE_API}/swap`;
    console.log("Requesting Swap Transaction...");
    const swapRes = await axios.post(swapUrl, {
        quoteResponse,
        userPublicKey: wallet.publicKey.toBase58(),
        wrapAndUnwrapSol: true
    });
    
    const { swapTransaction } = swapRes.data;

    // 3. Deserialize and Sign
    console.log("Signing Transaction...");
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    transaction.sign([wallet]);

    // 4. Send Raw Transaction
    console.log("Sending Transaction to Solana Network...");
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2
    });

    console.log(`✅ Trade Sent! Signature: ${txid}`);
    console.log("Waiting for confirmation...");
    
    const confirmation = await connection.confirmTransaction(txid, 'confirmed');
    if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    console.log("Transaction Confirmed!");
    
    const txDetail = await connection.getTransaction(txid, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    const fee = txDetail?.meta?.fee || 0;
    const feeSOL = (fee / 1e9).toFixed(9);
    console.log(`Gas Fee: ${fee} Lamports (${feeSOL} SOL)`);

    return { hash: txid, gasFee: feeSOL };
}

// Main Function
export async function swapSOLToTokenJupiter(tokenAddress: string, amountSOL: string, slippageBps: number = 500, privateKey: string) {
    console.log(`\n--- Jupiter Swap: ${amountSOL} SOL -> ${tokenAddress} ---`);
    const amountLamports = (parseFloat(amountSOL) * 1e9).toFixed(0);
    if (!privateKey) {
        throw new Error("SOL private key is required");
    }
    const wallet = createWallet(privateKey);

    // Pre-Swap Checks
    const balanceBefore = await connection.getBalance(wallet.publicKey);
    let tokenBalanceBefore = 0;
    const accountsBefore = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { mint: new PublicKey(tokenAddress) });
    const beforeAccount = accountsBefore.value[0];
    if (beforeAccount) {
        tokenBalanceBefore = beforeAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
    }

    let result;
    try {
        if (JUPITER_API_KEY) {
            try {
                result = await tradeUltra(SOL_MINT, tokenAddress, amountLamports, slippageBps, wallet);
            } catch (e: any) {
                console.warn(`⚠️ Ultra API failed (${e.response?.status || e.message}), falling back to V6 Public API...`);
                result = await tradeV6(SOL_MINT, tokenAddress, amountLamports, slippageBps, wallet);
            }
        } else {
            console.log("ℹ️ No JUPITER_API_KEY found. Using Public V6 API.");
            result = await tradeV6(SOL_MINT, tokenAddress, amountLamports, slippageBps, wallet);
        }
        
        // Post-Swap Logic (Common for both trade functions)
        // tradeUltra/tradeV6 return { hash, gasFee } but gasFee is just the transaction fee from receipt.
        // We want the "Real Cost" (Overhead).
        
        const balanceAfter = await connection.getBalance(wallet.publicKey);
        
        let tokenBalanceAfter = 0;
        const accountsAfter = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { mint: new PublicKey(tokenAddress) });
        const afterAccount = accountsAfter.value[0];
        if (afterAccount) {
            tokenBalanceAfter = afterAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
        }

        const nativeSpentLamports = balanceBefore - balanceAfter;
        const nativeSpentSOL = (nativeSpentLamports / 1e9).toFixed(9);
        
        const overheadSOL = (nativeSpentLamports / 1e9) - parseFloat(amountSOL);
        const overheadPct = (overheadSOL / parseFloat(amountSOL)) * 100;
        
        const gainedToken = tokenBalanceAfter - tokenBalanceBefore;

        if (gainedToken <= 0) {
             console.warn("⚠️ Warning: Token balance did not increase! Swap might have failed or tokens not yet received.");
        } else {
             console.log(`✅ Swap Verified! Received ${gainedToken} tokens.`);
        }

        console.log(`💰 Financial Summary:`);
        console.log(`   Input Amount: ${amountSOL} SOL`);
        console.log(`   Total Spent:  ${nativeSpentSOL} SOL (Input + Gas + Rent)`);
        console.log(`   Real Cost (Overhead): ${overheadSOL.toFixed(9)} SOL`);
        console.log(`   Overhead %: ${overheadPct.toFixed(4)}%`);
        
        return { 
            hash: result.hash, 
            gasFee: overheadSOL.toFixed(9), // Use Real Cost
            totalSpent: nativeSpentSOL,
            overheadPercentage: overheadPct.toFixed(4),
            tokenGained: gainedToken.toString()
        };

    } catch (e: any) {
        console.error("❌ Trade Failed:", e.response?.data || e.message);
        throw e;
    }
}
