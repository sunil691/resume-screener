"use client";

import { useTransition } from "react";
import { retryAnalysisAction } from "@/app/admin/actions";

export function RetryAnalysisButton({ applicationId, jobId }: { applicationId: string; jobId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await retryAnalysisAction(formData);
        });
      }}
    >
      <input name="applicationId" type="hidden" value={applicationId} />
      <input name="jobId" type="hidden" value={jobId} />
      <button
        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Retrying analysis…" : "Retry Analysis"}
      </button>
    </form>
  );
}
