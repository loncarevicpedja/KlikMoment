"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mediaUrlFromPublicUrl } from "@/lib/media-url";

type CoverUploadProps = {
  eventId: string;
  coverImageUrl?: string | null;
  onUpdated?: (coverImageUrl: string) => void;
  /** Admin form: defer upload until parent submit. Owner: upload on button click. */
  uploadOnSave?: boolean;
  onFileSelected?: (file: File | null) => void;
  selectedFile?: File | null;
};

export function CoverUpload({
  eventId,
  coverImageUrl,
  onUpdated,
  uploadOnSave = true,
  onFileSelected,
  selectedFile,
}: CoverUploadProps) {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentCover, setCurrentCover] = useState(coverImageUrl ?? null);
  const [uploading, setUploading] = useState(false);

  const file = selectedFile !== undefined ? selectedFile : localFile;

  const handleFileChange = (next: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
    if (onFileSelected) {
      onFileSelected(next);
    } else {
      setLocalFile(next);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose an image first");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`/api/events/${eventId}/cover`, {
      method: "POST",
      body: fd,
    });

    setUploading(false);

    if (!res.ok) {
      toast.error("Failed to upload cover");
      return;
    }

    const updated = await res.json();
    setCurrentCover(updated.coverImageUrl);
    handleFileChange(null);
    toast.success("Cover image updated");
    onUpdated?.(updated.coverImageUrl);
  };

  const displayUrl =
    previewUrl ??
    (currentCover ? mediaUrlFromPublicUrl(currentCover) : null);

  return (
    <div className="space-y-3">
      {displayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt="Event cover"
          className="max-h-80 w-full rounded-xl bg-slate-100 object-contain"
        />
      )}

      <div>
        <Label htmlFor={`cover-${eventId}`}>Cover image</Label>
        <Input
          id={`cover-${eventId}`}
          type="file"
          accept="image/*"
          className="mt-1.5"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {uploadOnSave && (
        <Button
          type="button"
          variant="secondary"
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading
            ? "Uploading..."
            : currentCover
              ? "Replace cover"
              : "Upload cover"}
        </Button>
      )}
    </div>
  );
}
