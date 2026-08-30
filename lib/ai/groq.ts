import "server-only";
import Groq from "groq-sdk";
import { z } from "zod";
import { serverEnv } from "@/lib/env.server";
import { SYSTEM_PROMPT } from "@/prompts/resume-analysis";

export const evidenceAssessmentSchema = z.enum(["strong", "moderate", "weak", "missing"]);

export const resumeAnalysisOutputSchema = z.object({
  match_score: z.coerce.number().int().min(0, "Score must be at least 0.").max(100, "Score cannot exceed 100."),
  fit_summary: z.string().trim().min(1, "Fit summary is required."),
  strengths: z.array(z.string().trim().min(1)).default([]),
  gaps: z.array(z.string().trim().min(1)).default([]),
  follow_up_questions: z.array(z.string().trim().min(1)).default([]),
  evidence: z
    .array(
      z.object({
        requirement: z.string().trim().min(1, "Requirement name is required."),
        assessment: evidenceAssessmentSchema,
        evidence: z.string().trim().min(1, "Evidence description is required."),
      })
    )
    .default([]),
});

export type ResumeAnalysisOutput = z.infer<typeof resumeAnalysisOutputSchema>;

export function cleanJsonContent(rawContent: string): string {
  let cleaned = rawContent.trim();

  // Remove markdown code fences if present (e.g. ```json ... ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  return cleaned;
}

export async function requestGroqAnalysis(userPrompt: string): Promise<{
  data: ResumeAnalysisOutput | null;
  model: string;
  error: string | null;
}> {
  const apiKey = serverEnv.groqApiKey;
  const model = serverEnv.groqModel || "openai/gpt-oss-120b";

  if (!apiKey) {
    return { data: null, model, error: "GROQ_API_KEY environment variable is not configured." };
  }

  const groq = new Groq({ apiKey });

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { data: null, model, error: "LLM returned an empty response." };
    }

    const cleanedContent = cleanJsonContent(content);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanedContent);
    } catch {
      return { data: null, model, error: "LLM response could not be parsed as JSON." };
    }

    const validationResult = resumeAnalysisOutputSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      const issueDetails = validationResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return { data: null, model, error: `LLM response failed schema validation: ${issueDetails}` };
    }

    return { data: validationResult.data, model, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown Groq API error";
    return { data: null, model, error: `Groq API request failed: ${message}` };
  }
}
