import "server-only";

export const MAX_RESUME_TEXT_LENGTH = 12000;

export type SanitizedResumeResult = {
  text: string;
  isTruncated: boolean;
};

export function sanitizeResumeText(rawText: string): SanitizedResumeResult {
  const cleanedText = rawText.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();

  if (cleanedText.length <= MAX_RESUME_TEXT_LENGTH) {
    return { text: cleanedText, isTruncated: false };
  }

  // Find a clean boundary (newline or period) near the threshold
  let cutoff = MAX_RESUME_TEXT_LENGTH;
  const lastNewline = cleanedText.lastIndexOf("\n", cutoff);
  if (lastNewline > cutoff - 1000) {
    cutoff = lastNewline;
  } else {
    const lastPeriod = cleanedText.lastIndexOf(".", cutoff);
    if (lastPeriod > cutoff - 500) {
      cutoff = lastPeriod + 1;
    }
  }

  const truncatedText = `${cleanedText.slice(0, cutoff).trim()}\n\n[Note: Resume text was truncated to fit context limits.]`;
  return { text: truncatedText, isTruncated: true };
}
