import axios from "axios"; 
import * as dotenv from "dotenv"; 
dotenv.config(); 

const X_API_KEY = process.env.X_API_KEY; 
const BASE = "https://prod.ave-api.com/v2"; 
const DEFAULT_LIMIT = 5;

// Removed top-level process.exit to allow module usage
if (!X_API_KEY) { 
  console.warn("Missing X_API_KEY in .env. Get one at `https://cloud.ave.ai/register` "); 
} 

type SearchResp = { 
  status: number; 
  msg: string; 
  data_type?: number; 
  data?: any[]; 
}; 

// Internal helper to call the API
async function callSearchApi(keyword: string, chain?: string, limit =  DEFAULT_LIMIT) { 
  if (!X_API_KEY) throw new Error("Missing X_API_KEY");
  
  const params: any = { keyword, limit }; 

  // Filter by chain if specified
  if (chain) params.chain = chain; 
  const url = `${BASE}/tokens`; 
  const resp = await axios.get<SearchResp>(url, { 
    params, 
    headers: { "X-API-KEY": X_API_KEY }, 
    timeout: 15000 
  }); 
  return resp.data; 
} 

async function getTokenDetail(tokenId: string) { 
  if (!X_API_KEY) throw new Error("Missing X_API_KEY");

  const url = `${BASE}/tokens/${encodeURIComponent(tokenId)}`; 
  const resp = await axios.get(url, { 
    headers: { "X-API-KEY": X_API_KEY }, 
    timeout: 15000 
  }); 
  return resp.data; 
} 

function extractContractFromAppendix(item: any) { 
  // some responses include `appendix` as JSON string 
  if (!item) return null; 
  try { 
    if (typeof item.appendix === "string" && item.appendix.length) { 
      const parsed = JSON.parse(item.appendix); 
      if (parsed?.contractAddress) return parsed.contractAddress; 
      // sometimes contract is named differently 
      if (parsed?.contract?.address) return parsed.contract.address; 
    } 
  } catch (e) { 
    // ignore parse errors 
  } 
  // fallback fields commonly present 
  if (item.contractAddress) return item.contractAddress; 
  if (item.address) return item.address; 
  return null; 
} 

/**
 * Searches for tokens and returns a formatted list.
 * @param keyword The keyword to search for (symbol, name, or address)
 * @param chain The chain to search on (optional, null/undefined means all chains)
 * @param limit The number of results to return (default: DEFAULT_LIMIT or 1)
 */
export async function searchTokens(keyword: string, chain?: string, limit: number = DEFAULT_LIMIT) {
    const resp = await callSearchApi(keyword, chain, limit);
    
    if (!resp || !resp.data) {
        return [];
    }
    
    return resp.data.slice(0, limit).map((r: any) => ({
        token_id: r.token,
        name: r.name,
        symbol: r.symbol,
        chain: r.chain,
        decimals: r.decimal
    }));
}

// Main execution block (CLI)
async function main() { 
  // Check if run directly
  if (import.meta.main || require.main === module) {
      const argv = process.argv.slice(2); 
      if (argv.length === 0) { 
        console.log("Usage:"); 
        console.log("  bun run src/scripts/token_info.ts search <keyword> [chain] [limit]"); 
        console.log("  bun run src/scripts/token_info.ts detail <token-id>"); 
        process.exit(0); 
      } 
    
      const cmd = argv[0]; 
    
      try { 
        if (cmd === "search") { 
         const keyword = argv[1]; 
         const chain = argv[2] || undefined;
         const limit = parseInt(argv[3]) ||  DEFAULT_LIMIT;
         if (!keyword) { 
           console.error("search requires a keyword (symbol, name or contract address)."); 
           process.exit(1); 
         } 
         
         const results = await searchTokens(keyword, chain, limit);
         console.log(JSON.stringify(results, null, 2));

       } else if (cmd === "detail") { 
          const tokenId = argv[1]; 
          if (!tokenId) { 
            console.error("detail requires a token-id (like returned in search: token-chain)."); 
            process.exit(1); 
          } 
          console.log(`Fetching detail for token-id=${tokenId} ...`); 
          const detail = await getTokenDetail(tokenId); 
          console.log("Full token detail (raw):\n", JSON.stringify(detail, null, 2)); 
          // try extract contract from data 
          if (detail?.data) { 
            const d = detail.data; 
            const contract = extractContractFromAppendix(d) || d.contractAddress || "N/A"; 
            console.log("\nBest-effort contract address:", contract); 
          } 
        } else { 
          console.error("Unknown command:", cmd); 
          process.exit(1); 
        } 
      } catch (err: any) { 
        if (err.response) { 
          console.error("API error:", err.response.status, err.response.data); 
        } else { 
          console.error("Error:", err.message || err); 
        } 
        process.exit(1); 
      } 
  }
} 

main();
