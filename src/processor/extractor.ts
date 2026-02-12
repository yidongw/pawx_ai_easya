import { TICKERS, IGNORED_TICKERS } from '../utils/constants';

const _TICKER_MARKED_RE = /(?:^|[^A-Za-z0-9\u4e00-\u9fff])([$])([A-Za-z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff]*)(?![A-Za-z0-9\u4e00-\u9fff])/gu;

const _TOKEN_RE = /(?:^|[^\p{L}\p{N}])(?:[$#@])?([\p{L}\p{N}]+)(?![\p{L}\p{N}])/gu;

const _ALLCAPS_FALLBACK_RE = /(?<![A-Za-z0-9@_])([A-Z]{2,10})(?![A-Za-z0-9_])/g;

const _0X_CA_RE = /\b(0x[a-fA-F0-9]{40})\b/g;

const _BASE58_LIKE_RE = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/g;

export interface ExtractionResult {
  has_ticker: boolean;
  ticker: string[];
  CA: string | null;
  chain: "BSC" | "SOL" | null;
}

const isAlnum = (char: string) => /[\p{L}\p{N}]/u.test(char);

export function extract_ticker(text: string): ExtractionResult {
  if (!text) {
    return { has_ticker: false, ticker: [], CA: null, chain: null };
  }

  const found_tickers: string[] = [];
  const seen = new Set<string>();

  // --- Ticker detection ---

  const tokenMatches = text.matchAll(_TOKEN_RE);
  for (const m of tokenMatches) {
    const token_str = m[1]!;
    const t = token_str.toUpperCase();

    if (TICKERS.has(t) && !seen.has(t)) {
        const matchText = m[0] ?? token_str;
        const groupIndex = matchText.lastIndexOf(token_str);
        const matchStart = m.index ?? 0;
        const tokenStart = matchStart + (groupIndex >= 0 ? groupIndex : 0);

        let p = tokenStart - 1;
        // Python: while p >= 0 and text[p] in ('$', '#', '@'):
        while (p >= 0 && ['$', '#', '@'].includes(text[p]!)) {
            p -= 1;
        }

        // Python: if p >= 0 and text[p] in ("'", "’"):
        if (p >= 0 && ["'", "’"].includes(text[p]!)) {
            const prev_char_idx = p - 1;
            // Python: if prev_char_idx >= 0 and text[prev_char_idx].isalnum():
            if (prev_char_idx >= 0 && isAlnum(text[prev_char_idx]!)) {
                continue;
            }
        }

        seen.add(t);
        found_tickers.push(t);
    }
  }

  const tickerMarkedMatches = text.matchAll(_TICKER_MARKED_RE);
  for (const m of tickerMarkedMatches) {
      // Group 1 is '$', Group 2 is the token
      const token = m[2]!;
      const t_upper = token.toUpperCase();

      if (IGNORED_TICKERS.has(t_upper)) {
          continue;
      }

      if (!seen.has(t_upper)) {
          seen.add(t_upper);
          found_tickers.push(token);
      }
  }

  if (found_tickers.length === 0) {
      const allCapsMatches = text.matchAll(_ALLCAPS_FALLBACK_RE);
      for (const m2 of allCapsMatches) {
          const token = m2[1]!;
          if (!IGNORED_TICKERS.has(token.toUpperCase())) {
              found_tickers.push(token.toUpperCase());
              break; // Only one fallback
          }
      }
  }

  const has_ticker = found_tickers.length > 0;
  let ca: string | null = null;
  let chain: "BSC" | "SOL" | null = null;

  // CA detection
  // Clone regexes or use matchAll to ensure fresh state (though matchAll clones internally)
  const m0Matches = text.matchAll(_0X_CA_RE);
  let m0 = null;
  for (const m of m0Matches) { m0 = m; break; }

  if (m0) {
      ca = m0[1]!;
      chain = "BSC";
  } else {
      const m1Matches = text.matchAll(_BASE58_LIKE_RE);
      let m1 = null;
      for (const m of m1Matches) { m1 = m; break; }
      
      if (m1) {
          ca = m1[1]!;
          chain = "SOL";
      }
  }

  return {
      has_ticker,
      ticker: found_tickers,
      CA: ca,
      chain
  };
}
