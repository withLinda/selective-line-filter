export type Mode = 'keep' | 'remove';

export interface FilterOptions {
  mode: Mode;
  useRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
}

export interface FilterResult {
  output: string;
  total: number;
  kept: number;
  removed: number;
  matchedLines: number;
}

export function parseNeedles(input: string): string[] {
  // Split by newlines or commas; trim; drop empties.
  return input
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildPatterns(needles: string[], opts: Omit<FilterOptions, 'mode'>): RegExp[] {
  const flags = opts.caseSensitive ? 'u' : 'iu';
  return needles.map((raw) => {
    try {
      const body = opts.useRegex ? raw : escapeRegex(raw);
      const wrapped = opts.wholeWord ? `\\b${body}\\b` : body;
      return new RegExp(wrapped, flags);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid pattern: "${raw}" — ${msg}`);
    }
  });
}

export function filterLines(input: string, patterns: RegExp[], mode: Mode): FilterResult {
  const lines = input.split(/\r?\n/);
  if (patterns.length === 0) {
    return {
      output: input,
      total: lines.length,
      kept: lines.length,
      removed: 0,
      matchedLines: 0,
    };
  }
  const out: string[] = [];
  let matched = 0;

  for (const line of lines) {
    const isMatch = patterns.some((re) => re.test(line));
    if (isMatch) matched++;
    if (mode === 'keep') {
      if (isMatch) out.push(line);
    } else {
      if (!isMatch) out.push(line);
    }
  }

  const kept = out.length;
  const total = lines.length;
  const removed = total - kept;

  return {
    output: out.join('\n'),
    total,
    kept,
    removed,
    matchedLines: matched,
  };
}

export function safeFilter(
  text: string,
  needlesText: string,
  opts: FilterOptions
): { result?: FilterResult; error?: string } {
  const needles = parseNeedles(needlesText);
  try {
    const patterns = buildPatterns(needles, {
      useRegex: opts.useRegex,
      caseSensitive: opts.caseSensitive,
      wholeWord: opts.wholeWord,
    });
    const result = filterLines(text, patterns, opts.mode);
    return { result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
