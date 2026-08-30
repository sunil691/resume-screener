export type JobStatus = "open" | "closed";
export type ApplicationStatus = "pending" | "processing" | "completed" | "failed";
export type EvidenceAssessment = "strong" | "moderate" | "weak" | "missing";
export interface Job { id: string; title: string; company: string; description: string; status: JobStatus; createdAt: string; updatedAt: string; }
export interface Candidate { id: string; fullName: string; address: string; phone: string; email: string; age: number; currentLocation: string; createdAt: string; updatedAt: string; }
export interface Application { id: string; jobId: string; candidateId: string; resumeFilePath: string; resumeText: string | null; analysisStatus: ApplicationStatus; analysisError: string | null; createdAt: string; updatedAt: string; }
export interface ResumeAnalysisEvidence { requirement: string; assessment: EvidenceAssessment; evidence: string; resumeEvidence?: string | null; }
export interface ResumeAnalysis { id: string; applicationId: string; matchScore: number; fitSummary: string; strengths: string[]; gaps: string[]; followUpQuestions: string[]; evidence: ResumeAnalysisEvidence[]; model: string; promptVersion: string; createdAt: string; updatedAt: string; }
