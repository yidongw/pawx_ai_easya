import axios from 'axios';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const AVE_API_BASE_URL = 'https://bot-api.ave.ai';
const AVE_ACCESS_KEY = process.env.AVE_ACCESS_KEY;

// BNB Address for Ave API
const BNB_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
// BSC Router Address (Hardcoded from Ave Docs as API doesn't return it reliably)
const BSC_ROUTER_ADDRESS = '0x4eadd85e7a6bb368eb1e3fb22b56ecac79e9058f';

interface CreateTxResponse {
    status: number;
    msg: string;
    data: {
        chain: string;
        creatorAddress: string;
        swapType: string;
        inTokenAddress: string;
        outTokenAddress: string;
        toAddress?: string; // Made optional as it's missing in actual response
        to?: string;        // Check if it appears here
        txContent?: string; // Input Data (Docs name)
        txContext?: string; // Input Data (Actual response name)
        slippage: string;
        minReturn: string;
        inAmount: string;
        estimateOut: string;
        gasLimit: string;
        amms: string[];
        createPrice: string;
        requestTxId: string;
    };
}

/**
 * Swaps BNB for a specific token on BSC using Ave.ai API
 * @param tokenAddress The address of the token to buy
 * @param amountBNB The amount of BNB to swap (e.g., "0.01")
 * @param slippageBps Slippage in basis points (default 500 = 5%)
 */
export async function swapBNBToToken(tokenAddress: string, amountBNB: string, slippageBps: number = 500, privateKey: string) {
    if (!AVE_ACCESS_KEY) {
        throw new Error("AVE_ACCESS_KEY is not set in environment variables");
    }
  if (!privateKey) {
    throw new Error("BSC private key is required");
    }

    // Initialize wallet
    // We don't strictly need a provider to sign, but for sending directly we might. 
    // However, the API sends the tx for us via sendSignedEvmTx.
  const wallet = new ethers.Wallet(privateKey);
    const creatorAddress = wallet.address;

    console.log(`Initiating swap: ${amountBNB} BNB -> ${tokenAddress}`);
    console.log(`Creator Address: ${creatorAddress}`);

    // Check Balance
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const balanceBefore = await provider.getBalance(creatorAddress);
    const inAmountWei = ethers.parseEther(amountBNB);

    // Check Token Balance Before
  const tokenContract = new ethers.Contract(tokenAddress, ['function balanceOf(address) view returns (uint256)'], provider) as {
    balanceOf?: (address: string) => Promise<bigint>;
  };
  const tokenBalanceBefore = tokenContract.balanceOf ? await tokenContract.balanceOf(creatorAddress) : BigInt(0);

    console.log(`Wallet Balance: ${ethers.formatEther(balanceBefore)} BNB`);
    if (balanceBefore < inAmountWei) {
        throw new Error(`Insufficient funds. Balance: ${ethers.formatEther(balanceBefore)} BNB, Required: ${amountBNB} BNB`);
    }

    // 1. Create Transaction
    const createTxUrl = `${AVE_API_BASE_URL}/v1/thirdParty/chainWallet/createEvmTx`;
    const createTxPayload = {
        chain: 'bsc',
        creatorAddress: creatorAddress,
        inAmount: inAmountWei.toString(),
        inTokenAddress: BNB_ADDRESS,
        outTokenAddress: tokenAddress,
        swapType: 'buy',
        slippage: slippageBps.toString()
    };

    console.log("Calling Create Tx API...");
    try {
        // Headers: Try X-API-KEY and Ave-Access-Key
        const headers = {
            'Content-Type': 'application/json',
            'X-API-KEY': AVE_ACCESS_KEY,
            'Ave-Access-Key': AVE_ACCESS_KEY // Adding both to be safe as documentation is ambiguous
        };

        const createRes = await axios.post<CreateTxResponse>(createTxUrl, createTxPayload, { headers });
        
        console.log(`Create API Response: Status=${createRes.data.status}, Msg="${createRes.data.msg}"`);

        // Check for specific error status codes
        if (createRes.data.status === 3024) {
             console.error("❌ Execution Reverted (3024). This often means:");
             console.error("   1. The token might be a scam (honeypot) preventing buys.");
             console.error("   2. Slippage is too low for the tax.");
             console.error("   3. Insufficient liquidity.");
             throw new Error(`Create Tx Failed: execution reverted (Status: 3024). Token might be unsellable or tax > slippage.`);
        }

        if (createRes.data.status !== 0 && createRes.data.status !== 1) {
             // If status is not standard success codes, check if msg indicates success
             if (createRes.data.msg.toLowerCase() !== 'success') {
                 throw new Error(`Create Tx Failed: ${createRes.data.msg} (Status: ${createRes.data.status})`);
             }
        }
        
        const txData = createRes.data.data;
        const requestTxId = txData.requestTxId;
        // Use txContext if txContent is missing (API inconsistency)
        let txContent = txData.txContent || txData.txContext;
        
        // Ensure txContent starts with 0x
        if (txContent && !txContent.startsWith('0x')) {
            txContent = '0x' + txContent;
        }

        // Use hardcoded Router Address if API doesn't return it
        const toAddress = txData.toAddress || BSC_ROUTER_ADDRESS;
        const gasLimit = txData.gasLimit;
        
        if (!toAddress) {
            throw new Error("Target address (Router) is missing and no default provided.");
        }
        if (!txContent) {
            throw new Error("Transaction content (Input Data) is missing from API response.");
        }
        
        console.log(`Tx Created. Request ID: ${requestTxId}`);
        console.log(`Estimating Out: ${txData.estimateOut}`);
        console.log(`Target Address (Router): ${toAddress}`);
        // console.log(`Tx Content: ${txContent.substring(0, 50)}...`);

        // 2. Sign Transaction
        // We need to construct the transaction object to sign
        // The API gives us 'txContent' which is the data field.
        // It also gives 'toAddress', 'gasLimit'.
        // We need to fetch nonce and gasPrice/maxFeePerGas?
        // The API doc says: "Client usage returned txContent as InputData... and other needed parameters... call send transaction API"
        // But for 'sendSignedEvmTx', it takes 'signedTx'.
        // 'signedTx' usually requires nonce, gasPrice, gasLimit, to, value, data, chainId.
        
        // We need a provider to get the nonce and current gas price if the API doesn't provide it (it doesn't seem to).
        // Reuse the provider defined earlier
        const connectedWallet = wallet.connect(provider);
        
        const nonce = await provider.getTransactionCount(creatorAddress);
        const feeData = await provider.getFeeData();
        console.log("Fee Data:", JSON.stringify(feeData, (key, value) => key === '' ? value : (typeof value === 'bigint' ? value.toString() : value)));
        
        // BSC often works better with Legacy transactions or explicit gasPrice if EIP-1559 data is missing
        // Ensure gasPrice is at least 3 Gwei (BSC Minimum)
        const MIN_GAS_PRICE = BigInt("3000000000"); // 3 Gwei
        let gasPrice = feeData.gasPrice || MIN_GAS_PRICE;
        if (gasPrice < MIN_GAS_PRICE) {
            gasPrice = MIN_GAS_PRICE;
        }

        console.log("Using Gas Price:", gasPrice.toString());

        const txToSignStandard = {
            to: toAddress,
            data: txContent,
            value: inAmountWei,
            gasLimit: BigInt(gasLimit),
            nonce: nonce,
            chainId: 56,
            gasPrice: gasPrice,
            type: 0 // Legacy
        };

        // Debug transaction object
        console.log("Transaction to sign:", JSON.stringify(txToSignStandard, (key, value) =>
            key === '' ? value : (typeof value === 'bigint' ? value.toString() : value)
        , 2));
        
        // Option 1: Send via Ave API (Failed with "failed to parse signed tx")
        // Option 2: Send directly to chain (Allowed by docs: "or send transaction to chain yourself")
        
        console.log("Broadcasting transaction directly to BSC network...");
        
        // We can use wallet.sendTransaction which signs and sends.
        // We need to ensure the transaction object is clean for ethers.
        const txResponse = await connectedWallet.sendTransaction(txToSignStandard);
        
        console.log(`Trade Sent! Hash: ${txResponse.hash}`);
        console.log("Waiting for confirmation...");
        
        const receipt = await txResponse.wait();
        
        console.log(`Transaction Confirmed! Block: ${receipt?.blockNumber}`);
        
        // Post-Swap Verification
        const balanceAfter = await provider.getBalance(creatorAddress);
      const tokenBalanceAfter = tokenContract.balanceOf ? await tokenContract.balanceOf(creatorAddress) : BigInt(0);
        
        // Calculate Metrics
        const nativeSpentWei = balanceBefore - balanceAfter;
        const nativeSpentBNB = ethers.formatEther(nativeSpentWei);
        
        // Overhead (Gas/Fees) = TotalSpent - InputAmount
        // Note: nativeSpentWei should be >= inAmountWei.
        const overheadWei = nativeSpentWei - inAmountWei;
        const overheadBNB = ethers.formatEther(overheadWei > 0 ? overheadWei : 0);
        
        const gainedToken = tokenBalanceAfter - tokenBalanceBefore;
        
        if (gainedToken <= 0) {
            console.warn("⚠️ Warning: Token balance did not increase! Swap might have failed or tokens not yet received.");
        } else {
            console.log(`✅ Swap Verified! Received ${gainedToken.toString()} tokens.`);
        }
        
        const overheadPct = (parseFloat(overheadBNB) / parseFloat(amountBNB)) * 100;
        
        console.log(`💰 Financial Summary:`);
        console.log(`   Input Amount: ${amountBNB} BNB`);
        console.log(`   Total Spent:  ${nativeSpentBNB} BNB (Input + Gas)`);
        console.log(`   Real Cost (Overhead): ${overheadBNB} BNB`);
        console.log(`   Overhead %: ${overheadPct.toFixed(4)}%`);

        return { 
            hash: txResponse.hash, 
            gasFee: overheadBNB,
            totalSpent: nativeSpentBNB,
            overheadPercentage: overheadPct.toFixed(4),
            tokenGained: gainedToken.toString()
        };

    } catch (error: any) {
        console.error("Trade Error:", error.response?.data || error.message);
        throw error;
    }
}
