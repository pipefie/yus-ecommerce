'use client'

import { FormEvent, useState, useTransition } from "react";

type Props = {
  productId: number;
  productSlug: string;
};

type UploadResult =
  | { status: "idle"; message: null }
  | { status: "pending"; message: string | null }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function MockupUploader({ productSlug }: Props) {
  const [state, setState] = useState<UploadResult>({ status: "idle", message: null });
  const [isPending, startTransition] = useTransition();

  const actionUrl = `/api/admin/products/${encodeURIComponent(productSlug)}/mockups/import`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!formData.get("file")) {
      setState({ status: "error", message: "Select a ZIP archive before uploading." });
      return;
    }

    if (!formData.has("dryRun")) {
      formData.set("dryRun", "false");
    } else {
      formData.set("dryRun", "true");
    }

    startTransition(async () => {
      setState({ status: "pending", message: "Uploading mockups…" });
      try {
        const res = await fetch(actionUrl, {
          method: "POST",
          body: formData,
        });

        const json = (await res.json().catch(() => null)) as { importedCount?: number; error?: unknown } | null;

        if (!res.ok) {
          const errorMessage =
            typeof json?.error === "string"
              ? json.error
              : `Import failed with status ${res.status}. Check the ZIP and try again.`;
          setState({ status: "error", message: errorMessage });
          return;
        }

        if (json?.importedCount !== undefined) {
          const suffix = formData.get("dryRun") === "true" ? " (dry run)" : "";
          setState({
            status: "success",
            message: `Processed ${json.importedCount} images${suffix}.`,
          });
          if (formData.get("dryRun") !== "true") {
            form.reset();
          }
        } else {
          setState({
            status: "success",
            message: "Import completed.",
          });
        }
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Unexpected error while uploading mockups.",
        });
      }
    });
  }

  const effectiveStatus = isPending ? "pending" : state.status;

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs text-slate-200" encType="multipart/form-data">
      <label className="flex flex-col gap-1">
        <span className="text-slate-400">Mockup archive (.zip)</span>
        <input
          name="file"
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          className="rounded border border-dashed border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-100 hover:border-slate-600"
          required
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">Import mode</span>
          <select
            name="mode"
            defaultValue="append"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
          >
            <option value="append">Append (keep existing)</option>
            <option value="replace">Replace selected mockups</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-slate-300">
          <input name="dryRun" type="checkbox" defaultChecked />
          Dry run (validate archive without uploading)
        </label>
      </div>
      <button
        type="submit"
        disabled={effectiveStatus === "pending"}
        className="inline-flex items-center justify-center rounded bg-sky-500/80 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {effectiveStatus === "pending" ? "Processing…" : "Upload mockups"}
      </button>
      {state.message && (
        <p
          className={
            effectiveStatus === "error"
              ? "text-xs text-red-400"
              : effectiveStatus === "success"
                ? "text-xs text-emerald-400"
                : "text-xs text-slate-400"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
