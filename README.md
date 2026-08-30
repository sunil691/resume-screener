# Resume Screener

## Overview
Resume Screener is a modern, production-ready, Vercel-deployable application designed to streamline candidate resume screening for hiring teams while preserving full candidate privacy and data security.

The platform provides two strictly separated user experiences:
- **Public Candidate Portal**: Clean, accessible application interface where job seekers view open positions, submit their details, and upload `.docx` resumes with immediate neutral receipts.
- **Admin Dashboard**: Secure management interface for recruiters to create and manage job postings, review applications, download candidate resumes securely, and examine AI-generated match analyses grounded in job description evidence.

---

## Features

### Admin Experience
- **Password-based Authentication**: Secure server-side authentication using HTTP-only session cookies.
- **Job Posting Management**: Create new job openings with full titles, companies, and descriptions, and toggle statuses (`open` / `closed`).
- **Application Overview**: View all candidate submissions per job opening in a centralized table with match scores and status badges.
- **Candidate Profiles & Contact Info**: Access applicant details including name, email, phone, age, address, and current location.
- **Private Resume Access**: Securely view and download stored DOCX resumes via short-lived signed URLs.
- **AI-Powered Match Analysis**:
  - **Match Score**: 0–100 overall alignment rating.
  - **Fit Summary**: Concise executive summary of candidate fit against explicit JD requirements.
  - **Strengths**: Bulleted list of candidate strengths grounded in resume evidence.
  - **Gaps**: Missing or unmentioned job requirements.
  - **Follow-up Questions**: Recruiter interview questions to probe specific gaps.
  - **Requirement-Level Evidence**: Breakdown mapping explicit job requirements to specific resume evidence and assessment levels (`strong`, `moderate`, `weak`, `missing`).
- **Analysis Failure & Retry**: Graceful error handling for LLM processing with an Admin one-click retry trigger.

### Public Candidate Experience
- **Job Directory**: Browse current active open positions.
- **Public Application Form**: Simple submission form accepting applicant contact information and DOCX resume uploads.
- **Strict Format & Size Validation**: Accepts `.docx` files only (up to 4 MB) with client and server-side ZIP header/structure verification.
- **Neutral Confirmation Receipt**: Candidate receives immediate, clean feedback confirming submission without exposing AI scores, rankings, or internal evaluations.

---

## Architecture

Built on modern full-stack web technologies:
- **Framework**: Next.js 16 (App Router with Server Actions & Server Components) + TypeScript
- **Database**: Supabase PostgreSQL (Relational schema with foreign keys and Row Level Security)
- **Storage**: Supabase Storage (Private bucket for `.docx` files)
- **Document Parser**: Mammoth (`mammoth.extractRawText`) for server-side DOCX text extraction
- **AI Evaluation**: Groq API (`groq-sdk`) powering LLM evaluation
- **Schema Validation**: Zod for client forms, server payloads, and LLM output parsing
- **Deployment Target**: Vercel

### Data Relationships
- **Job (1) → Applications (Many)**: A single job opening can receive multiple candidate applications.
- **Application → Candidate (1:1)**: Each application references a specific candidate profile.
- **Application → ResumeAnalysis (1:1)**: Each application is associated with a single, idempotent analysis output.

---

## Resume Processing Flow

```
Candidate Upload (.docx)
  │
  ▼
Server-Side DOCX & ZIP Signature Validation
  │
  ▼
Private Supabase Storage Upload (resumes bucket)
  │
  ▼
Mammoth Text Extraction (extractRawText)
  │
  ▼
Application & Candidate Persistence (PostgreSQL)
  │
  ▼
Groq LLM Analysis (Sanitized text + Job Description)
  │
  ▼
Zod JSON Schema Validation
  │
  ▼
Idempotent Upsert into resume_analyses
  │
  ▼
Admin Review Dashboard
```

---

## AI Design

### Privacy-Preserving LLM Prompting
To prevent algorithmic bias and protect candidate privacy, candidate PII is **NEVER** sent to the LLM.

**Included in Groq LLM Prompt:**
- Job Title
- Company Name
- Full Job Description
- Extracted Resume Text (sanitized/truncated if needed)

**Excluded from Groq LLM Prompt:**
- Full Name
- Email Address
- Phone Number
- Physical Address
- Age
- Current Location

### Structured Output Schema
Groq returns a strictly typed JSON object validated by Zod containing:
- `match_score` (integer between 0 and 100)
- `fit_summary` (concise 2–4 sentence string)
- `strengths` (array of strings)
- `gaps` (array of strings)
- `follow_up_questions` (array of strings)
- `evidence` (array of requirement assessment objects)

*Note: The model is configurable via the `GROQ_MODEL` environment variable. The currently tested model is `openai/gpt-oss-120b`.*

---

## Security

- **Server-Side Admin Authentication**: Admin login validates passwords server-side and issues encrypted, HTTP-only, SameSite cookies.
- **Server-Only Credentials**: Critical secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `ADMIN_PASSWORD`, `ADMIN_AUTH_SECRET`) are imported using Next.js `server-only` to guarantee zero exposure in client bundles.
- **Private Storage**: Storage bucket `resumes` is set to `public = false`. Public HTTP GET requests are rejected with HTTP 400/403.
- **Short-Lived Signed URLs**: Resumes are downloaded by Admins via temporary, time-bound signed URLs.
- **Row Level Security (RLS)**: Enabled on all tables (`jobs`, `candidates`, `applications`, `resume_analyses`).
- **Candidate Privacy Protection**: Public candidate confirmation endpoints return only `{ error: null }` receipts with zero score or feedback leakage.
- **Environment Isolation**: `.env.local` is git-ignored and never committed.

---

## Database Schema

- `jobs`: Stores position details (`id`, `title`, `company`, `description`, `status`, `created_at`, `updated_at`).
- `candidates`: Stores applicant contact information (`id`, `full_name`, `address`, `phone`, `email`, `age`, `current_location`).
- `applications`: Connects candidates to jobs (`id`, `job_id`, `candidate_id`, `resume_file_path`, `resume_text`, `analysis_status`, `analysis_error`).
- `resume_analyses`: Stores AI analysis outputs (`id`, `application_id`, `match_score`, `fit_summary`, `strengths`, `gaps`, `follow_up_questions`, `evidence`, `model`, `prompt_version`).

---

## Local Setup

### Prerequisites
- Node.js (v20+ recommended)
- npm

### Installation
```bash
# Install dependencies
npm install

# Apply database migration (using Supabase CLI or Web Console)
# SQL schema: supabase/migrations/20260830120000_create_resume_screener_schema.sql

# Start development server
npm run dev
```

### Environment Variables
Create `.env.local` in the project root and populate the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
ADMIN_AUTH_SECRET=
ADMIN_PASSWORD=
```

---

## Deployment

### Deploying to Vercel
1. Push project source code to your GitHub repository.
2. Import repository into Vercel.
3. Configure Environment Variables in Vercel Project Settings matching your Supabase and Groq keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
   - `ADMIN_AUTH_SECRET`
   - `ADMIN_PASSWORD`
4. Deploy project.

---

## Testing & Quality Assurance

The application suite has been tested against the following scenarios:
- **End-to-End Candidate Submission**: Tested real candidate applications from upload through Groq analysis to Admin dashboard.
- **Multi-Application Flow**: Verified multiple applications submitted to the same job maintain distinct storage paths and non-overwriting analysis records.
- **File Validation**: Tested and confirmed rejection of `.pdf` uploads, plain-text files renamed to `.docx`, corrupted ZIP payloads, and files > 4 MB.
- **Closed & Invalid Job Handling**: Verified closed jobs are hidden from public listings and reject candidate submissions.
- **Public / Admin Separation**: Verified unauthenticated access to `/admin` routes is blocked.
- **Privacy Audits**: Verified candidate receipts contain no AI scores, storage bucket is private, and candidate PII is omitted from Groq prompts.
- **Idempotency & Retries**: Verified retrying analysis updates the existing analysis row without creating duplicates.
- **Build Verification**: `npm run typecheck`, `npm run lint`, and `npm run build` pass with zero errors.

---

## Take-Home Assignment Write-up

This implementation prioritizes a **pragmatic, production-ready architecture** focused on robust data security and evidence-based AI evaluation. By establishing a strict relational `Job (1) → Applications (N)` database model with separate `candidates` and `resume_analyses` tables, the system guarantees clean domain isolation and query performance. 

Candidate privacy is built in by design: applicant PII is filtered out before LLM prompt construction, and public candidate endpoints return only neutral receipt confirmations to eliminate evaluation leaks or bias. Resumes are stored in a private Supabase bucket and accessed exclusively via short-lived signed URLs generated for authenticated Admins.

Key trade-offs include selecting `.docx` processing via Mammoth for exact structural text extraction, avoiding heavy document conversion dependencies. With additional engineering time, future enhancements could include asynchronous background job queues (e.g., BullMQ or Ingest) for high-volume LLM batch processing, automated candidate email notifications, and multi-tenant recruiter organization roles.
