const _0X_CA_RE = /\b(0x[a-fA-F0-9]{40})\b/g;

const _BASE58_LIKE_RE = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/g;

export interface CAExtractionResult {
  has_CA: boolean;
  CA: string | null;
  chain: "BSC" | "SOL" | null;
}

export function extract_CA(text: string): CAExtractionResult {
  if (!text) {
    return { has_CA: false, CA: null, chain: null };
  }

  let ca: string | null = null;
  let chain: "BSC" | "SOL" | null = null;

  // CA detection

  const m0Matches = text.matchAll(_0X_CA_RE);
  let m0 = null;
  for (const m of m0Matches) { m0 = m; break; }

  if (m0) {
    ca = m0[1] ?? null;
    chain = "BSC";
  } else {
    const m1Matches = text.matchAll(_BASE58_LIKE_RE);
    let m1 = null;
    for (const m of m1Matches) { m1 = m; break; }

    if (m1) {
      ca = m1[1] ?? null;
      chain = "SOL";
    }
  }

  return {
      has_CA: !!ca,
      CA: ca,
      chain
  };
}
