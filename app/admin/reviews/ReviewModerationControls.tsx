"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moderateReviewAction } from "@/app/actions/review.actions";
import { type ReviewAction } from "@/lib/reviews";

export function ReviewModerationControls({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const actions: { action: ReviewAction; label: string }[] = status === "PUBLISHED" ? [{ action: "UNPUBLISH", label: "Unpublish" }]
    : status === "APPROVED" ? [{ action: "PUBLISH", label: "Publish" }, { action: "REJECT", label: "Reject" }]
    : status === "REJECTED" ? [{ action: "APPROVE", label: "Approve" }]
    : status === "PENDING" ? [{ action: "APPROVE", label: "Approve" }, { action: "REJECT", label: "Reject" }] : [];
  async function moderate(action: ReviewAction) {
    setBusy(true); setError("");
    try {
      const result = await moderateReviewAction({ id, expectedStatus: status, action });
      if (!result.success) setError(result.error);
      router.refresh();
    } catch { setError("Unable to update this review. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2"><div className="flex flex-wrap gap-2">{actions.map(({ action, label }) => <button key={action} disabled={busy} onClick={() => moderate(action)} className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50 ${action === "REJECT" ? "border-red-200 text-red-700" : "border-wine-200 text-wine-900"}`}>{label}</button>)}</div>{busy && <p role="status" className="text-xs">Saving…</p>}{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}
