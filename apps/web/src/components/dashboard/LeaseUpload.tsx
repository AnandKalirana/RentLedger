"use client";

import { useRef, useState } from "react";
import { FileText, Upload, ExternalLink } from "lucide-react";
import { api, resolveFileUrl } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function LeaseUpload({
  tenantId,
  leaseUrl: initialLeaseUrl,
  onUploaded,
}: {
  tenantId: string;
  leaseUrl?: string | null;
  onUploaded?: () => void;
}) {
  const [leaseUrl, setLeaseUrl] = useState<string | null | undefined>(initialLeaseUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("leaseDocument", file);
      const res = await api.post<{ data: { leaseDocumentUrl?: string } }>(
        `/tenants/${tenantId}/lease`,
        formData
      );
      setLeaseUrl(res.data.data.leaseDocumentUrl);
      success("Lease document uploaded successfully");
      if (onUploaded) onUploaded();
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to upload lease document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-[var(--radius-input)] bg-[var(--stamp-soft)] p-2.5 text-[var(--color-accent-deep)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--color-ink)]">Lease Agreement Document</h3>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--color-muted)]">
              Upload PDF or image copy of the signed lease agreement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {leaseUrl && (
            <a
              href={resolveFileUrl(leaseUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-input)] bg-[var(--color-cotton)] px-3 text-[0.8125rem] font-medium text-[var(--color-ink)] shadow-[var(--shadow-key)] transition-[background-color,transform] duration-150 hover:bg-[var(--color-paper-2)] active:translate-y-px active:bg-[var(--color-paper-3)]"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View / Download
            </a>
          )}
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--radius-input)] bg-[var(--color-cotton)] px-3 text-[0.8125rem] font-medium text-[var(--color-ink)] shadow-[var(--shadow-key)] transition-[background-color,transform] duration-150 hover:bg-[var(--color-paper-2)] active:translate-y-px active:bg-[var(--color-paper-3)] focus-within:ring-2 focus-within:ring-[var(--color-focus)] focus-within:ring-offset-2">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : leaseUrl ? "Replace document" : "Upload document"}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
