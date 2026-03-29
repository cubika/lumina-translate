/**
 * Paste text cleanup utility.
 *
 * Reconstructs paragraph structure from text that was copy-pasted from PDFs,
 * e-books, or other sources where artificial line breaks were inserted.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Matches a single CJK ideograph (CJK Unified + Extension A/B, CJK compat). */
const CJK_CHAR =
  /[\u2E80-\u2FFF\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF66-\uFF9F\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}\u{2B740}-\u{2B81F}]/u;

/** CJK sentence-ending punctuation. */
const CJK_SENTENCE_END = /[。！？：；…]$/;

/** Latin sentence-ending punctuation. */
const LATIN_SENTENCE_END = /[.!?:;]$/;

/** Combined sentence-ending punctuation (CJK + Latin + ellipsis). */
const SENTENCE_END = /[.!?:;。！？：；…]$/;

/** Starts with an uppercase ASCII letter. */
const STARTS_UPPER = /^[A-Z]/;

/** Starts with a CJK character. */
const STARTS_CJK = new RegExp(`^${CJK_CHAR.source}`, "u");

/** Starts with a bullet marker. */
const STARTS_BULLET = /^[-*•●◦▪]\s/;

/** Starts with a numbered list marker (e.g. "1.", "2)", "12."). */
const STARTS_NUMBERED = /^\d+[.)]\s/;

/** Starts with a Markdown heading marker. */
const STARTS_HEADING = /^#{1,6}\s/;

/** Line starts with a structural marker (bullet, number, heading). */
function isStructuralStart(line: string): boolean {
  return (
    STARTS_BULLET.test(line) ||
    STARTS_NUMBERED.test(line) ||
    STARTS_HEADING.test(line)
  );
}

/** Returns true when the last character of `line` is a CJK ideograph. */
function endsWithCJK(line: string): boolean {
  return CJK_CHAR.test(line.charAt(line.length - 1));
}

/** Returns true when the first character of `line` is a CJK ideograph. */
function startsWithCJK(line: string): boolean {
  return STARTS_CJK.test(line);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Clean up text pasted from external sources.
 *
 * Removes artificial line-breaks while preserving intentional paragraph
 * boundaries, bullet/numbered lists, headings, and CJK formatting.
 */
export function reformatPastedText(text: string): string {
  // Edge cases -----------------------------------------------------------
  if (!text) return "";
  if (!text.trim()) return "";

  // Normalize whitespace -------------------------------------------------
  // 1. Line endings → \n
  let normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // 2. Tabs → spaces, collapse runs of spaces (but not newlines)
  normalized = normalized
    .replace(/\t/g, " ")
    .replace(/[^\S\n]+/g, " ");
  // 3. Trim trailing spaces per line
  normalized = normalized.replace(/ +\n/g, "\n").replace(/ +$/, "");

  // Split into paragraph blocks (separated by 2+ newlines) ---------------
  const blocks = normalized.split(/\n{2,}/);

  const rebuiltBlocks: string[] = [];

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    const lines = trimmedBlock.split("\n").map((l) => l.trim());
    if (lines.length === 0) continue;

    // Single-line block – nothing to join
    if (lines.length === 1) {
      rebuiltBlocks.push(lines[0]);
      continue;
    }

    // Compute average non-empty line length for the "short last line" heuristic.
    const lengths = lines.map((l) => l.length).filter((len) => len > 0);
    const avgLen =
      lengths.length > 0
        ? lengths.reduce((a, b) => a + b, 0) / lengths.length
        : 0;
    const shortThreshold = avgLen * 0.5;

    // Walk through lines and decide whether to join or keep breaks.
    const resultLines: string[] = [lines[0]];

    for (let i = 1; i < lines.length; i++) {
      const prevLine = lines[i - 1];
      const curLine = lines[i];

      // Empty lines within a block shouldn't happen after split, but guard.
      if (!curLine) continue;

      // Rule: structural start (bullet, number, heading) → keep break.
      if (isStructuralStart(curLine)) {
        resultLines.push(curLine);
        continue;
      }

      // Rule: previous line is a structural element (heading, bullet, number)
      // → keep break so content after headings/lists stays separate.
      if (isStructuralStart(prevLine)) {
        resultLines.push(curLine);
        continue;
      }

      // Rule (CJK): previous line ends with CJK sentence-ending punctuation
      // → always a real paragraph break.
      if (CJK_SENTENCE_END.test(prevLine)) {
        resultLines.push(curLine);
        continue;
      }

      // Rule (Latin): previous line ends with sentence punctuation AND next
      // line starts with uppercase or CJK → likely a real paragraph boundary.
      if (LATIN_SENTENCE_END.test(prevLine) && (STARTS_UPPER.test(curLine) || startsWithCJK(curLine))) {
        resultLines.push(curLine);
        continue;
      }

      // Rule: previous line is significantly shorter than average AND ends
      // with punctuation → likely the last line of a paragraph.
      if (
        prevLine.length < shortThreshold &&
        prevLine.length > 0 &&
        SENTENCE_END.test(prevLine)
      ) {
        resultLines.push(curLine);
        continue;
      }

      // --- Join lines -------------------------------------------------------

      const lastResult = resultLines[resultLines.length - 1];

      // CJK-aware joining: if the boundary is CJK↔CJK, join without space.
      if (endsWithCJK(lastResult) || startsWithCJK(curLine)) {
        // If previous ends with CJK sentence-ending punctuation, that was
        // already handled above (kept as break). Here we join.
        // CJK↔CJK or CJK↔Latin or Latin↔CJK: no extra space for CJK side,
        // but add a space when the other side is Latin.
        if (endsWithCJK(lastResult) && startsWithCJK(curLine)) {
          // Both CJK – join directly.
          resultLines[resultLines.length - 1] = lastResult + curLine;
        } else {
          // Mixed CJK/Latin boundary – join with space.
          resultLines[resultLines.length - 1] = lastResult + " " + curLine;
        }
      } else {
        // Latin – join with a single space.
        resultLines[resultLines.length - 1] = lastResult + " " + curLine;
      }
    }

    rebuiltBlocks.push(resultLines.join("\n"));
  }

  return rebuiltBlocks.join("\n\n");
}
