"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
};

type GuestUploadProps = {
  slug: string;
  disabled?: boolean;
  onUploaded?: () => void;
};

export function GuestUpload({ slug, disabled, onUploaded }: GuestUploadProps) {
  const [authorName, setAuthorName] = useState("");
  const [queue, setQueue] = useState<UploadItem[]>([]);

  const uploadFile = async (item: UploadItem) => {
    setQueue((q) =>
      q.map((x) =>
        x.id === item.id ? { ...x, status: "uploading", progress: 10 } : x
      )
    );

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("file", item.file);
    if (authorName) formData.append("authorName", authorName);

    try {
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setQueue((q) =>
              q.map((x) => (x.id === item.id ? { ...x, progress: pct } : x))
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(xhr.responseText));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", "/api/photos/upload");
        xhr.send(formData);
      });

      setQueue((q) =>
        q.map((x) =>
          x.id === item.id ? { ...x, status: "done", progress: 100 } : x
        )
      );
      onUploaded?.();
    } catch {
      setQueue((q) =>
        q.map((x) => (x.id === item.id ? { ...x, status: "error" } : x))
      );
      toast.error(`Failed to upload ${item.file.name}`);
    }
  };

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (disabled) return;
      const items: UploadItem[] = accepted.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "pending",
      }));
      setQueue((q) => [...q, ...items]);
      items.forEach((item) => void uploadFile(item));
    },
    [disabled, authorName, slug]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    disabled,
    multiple: true,
  });

  const removeItem = (id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="author">Your name (optional)</Label>
        <Input
          id="author"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="e.g. Ana"
          className="mt-1.5"
          disabled={disabled}
        />
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition",
          isDragActive
            ? "border-violet-400 bg-violet-50"
            : "border-slate-200 bg-slate-50/50 hover:border-violet-300 hover:bg-violet-50/30",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <CloudUpload className="mx-auto mb-3 h-10 w-10 text-violet-500" />
        <p className="font-medium text-slate-800">
          {isDragActive ? "Drop photos here" : "Drag & drop photos"}
        </p>
        <p className="mt-1 text-sm text-slate-500">JPG, PNG, WEBP up to 15MB</p>
      </div>

      <AnimatePresence>
        {queue.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{item.file.name}</span>
              <button type="button" onClick={() => removeItem(item.id)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <Progress value={item.progress} />
            <p className="mt-1 text-xs text-slate-500 capitalize">{item.status}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
