"use client";

import { useEffect, useRef, useState } from "react";

export function SignOutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    setError("");
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function confirmSignOut() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "X-Sudha-Logout": "1" },
      });
      if (!response.ok) throw new Error(`Sign-out failed: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error("Sign-out failed");
      // Start a fresh document so cached account and cart UI are discarded.
      window.location.replace("/login");
    } catch {
      setError("We couldn’t sign you out. Please try again.");
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="sign-out-title"
      aria-describedby="sign-out-description"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting.current) onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border border-gold-500/50 bg-ivory-50 p-6 text-wine-900 shadow-2xl backdrop:bg-wine-950/70"
    >
      <h2 id="sign-out-title" className="font-serif text-2xl">Sign out?</h2>
      <p id="sign-out-description" className="mt-3 text-sm leading-6 text-stone-600">
        Are you sure you want to sign out of Sudha Collections?
      </p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" autoFocus disabled={busy} onClick={onClose} className="min-h-11 flex-1 rounded border border-ivory-300 px-4 py-3 text-sm font-semibold text-wine-900 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" disabled={busy} onClick={confirmSignOut} className="min-h-11 flex-1 rounded bg-wine-900 px-4 py-3 text-sm font-semibold text-gold-300 disabled:opacity-50">
          {busy ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </dialog>
  );
}
