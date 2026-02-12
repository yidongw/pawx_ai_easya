import * as fs from 'fs';
import * as path from 'path';

const resolveCsvPath = () => {
    const envPath = process.env.TOKEN_MAPPING_CSV_PATH?.trim();
    if (envPath) {
        return envPath;
    }
    let current = process.cwd();
    for (let i = 0; i < 5; i++) {
        const candidate = path.resolve(current, 'token_mapping.csv');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        current = path.resolve(current, '..');
    }
    return path.resolve(process.cwd(), 'token_mapping.csv');
};

const CSV_PATH = resolveCsvPath();

function loadTickersFromCsv(): Set<string> {
    const tickers = new Set<string>();
    try {
        if (fs.existsSync(CSV_PATH)) {
            const content = fs.readFileSync(CSV_PATH, 'utf-8');
            const lines = content.split(/\r?\n/);
            for (let i = 1; i < lines.length; i++) {
                const lineValue = lines[i];
                if (!lineValue) {
                    continue;
                }
                const line = lineValue.trim();
                if (!line) {
                    continue;
                }
                const parts = line.split(',');
                const symbolRaw = parts[1];
                if (!symbolRaw) {
                    continue;
                }
                const symbol = symbolRaw.trim().toUpperCase();
                if (symbol) {
                    tickers.add(symbol);
                }
            }
        } else {
            console.warn(`Warning: CSV file not found at ${CSV_PATH}`);
        }
    } catch (error) {
        console.error("Error loading tickers from CSV:", error);
    }
    return tickers;
}

export const TICKERS = loadTickersFromCsv();

// List of tickers to ignore (uppercase)
export const IGNORED_TICKERS = new Set([
    "DYOR", "IRL", "APP", "CEO", "CTO", "KBW", "TOKEN","UI", "UX","UIUX", "DEX", "US", "AND", "OR", "NOT", "QE", "BUILD","DM", "AI", "FUD","SEC","IN", "CZ", "YOLO","ATH","GM", "AM", "PM", "RWA","IF", "CEX","BBW","FOX", "QA", "KOL", "CA", "JUST", "DAT", "CAUTION", "KYC", "GAS", "SG", "ALERT","AFTER","TLDR","YOUR","CVC","BC", "BUIDL", "AUM","UAE","ZH", "VIP", "PS","UTC", "IOS", "AMA", "MEME","TVL","FYI", "EU", "BREAKING", "UK"
]);
