"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, X } from "lucide-react";
import { toast } from "sonner";
import { sr } from "@/content/sr";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  isVideoMime,
  maxSizeForMime,
  resolveFileMime,
} from "@/lib/validations/photo";

type UploadItem = {
  id: string;
  file: File;
  mimeType: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
};

type GuestUploadProps = {
  slug: string;
  allowVideo?: boolean;
  disabled?: boolean;
  onUploaded?: () => void;
};

const IMAGE_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
} as const;

const VIDEO_ACCEPT = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
} as const;

export function GuestUpload({
  slug,
  allowVideo = true,
  disabled,
  onUploaded,
}: GuestUploadProps) {
  const [authorName, setAuthorName] = useState("");
  const [queue, setQueue] = useState<UploadItem[]>([]);

  const uploadVideo = async (item: UploadItem) => {
    setQueue((q) =>
      q.map((x) =>
        x.id === item.id ? { ...x, status: "uploading", progress: 5 } : x
      )
    );

    const initRes = await fetch("/api/photos/upload/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        mimeType: item.mimeType,
        sizeBytes: item.file.size,
        authorName: authorName || undefined,
      }),
    });

    if (!initRes.ok) {
      throw new Error((await initRes.json()).error ?? sr.toast.uploadFailed);
    }

    const { mediaId, storageKey, uploadUrl } = await initRes.json();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 90) + 5;
          setQueue((q) =>
            q.map((x) => (x.id === item.id ? { ...x, progress: pct } : x))
          );
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error("R2 upload failed"));
      };
      xhr.onerror = () => reject(new Error(sr.common.error));
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", item.mimeType);
      xhr.send(item.file);
    });

    const completeRes = await fetch("/api/photos/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        mediaId,
        storageKey,
        mimeType: item.mimeType,
        sizeBytes: item.file.size,
        authorName: authorName || undefined,
      }),
    });

    if (!completeRes.ok) {
      throw new Error((await completeRes.json()).error ?? sr.toast.uploadFailed);
    }
  };

  const uploadImage = async (item: UploadItem) => {
    setQueue((q) =>
      q.map((x) =>
        x.id === item.id ? { ...x, status: "uploading", progress: 10 } : x
      )
    );

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("file", item.file);
    if (authorName) formData.append("authorName", authorName);

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
      xhr.onerror = () => reject(new Error(sr.common.error));
      xhr.open("POST", "/api/photos/upload");
      xhr.send(formData);
    });
  };

  const uploadFile = async (item: UploadItem) => {
    try {
      if (isVideoMime(item.mimeType)) {
        if (!allowVideo) {
          throw new Error("Video nije uključen u paket");
        }
        await uploadVideo(item);
      } else {
        await uploadImage(item);
      }

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
      toast.error(`${sr.toast.uploadFailed}: ${item.file.name}`);
    }
  };

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (disabled) return;
      const items: UploadItem[] = accepted.map((file) => {
        const mimeType = resolveFileMime(file);
        return {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          mimeType,
          progress: 0,
          status: "pending",
        };
      });
      setQueue((q) => [...q, ...items]);
      items.forEach((item) => void uploadFile(item));
    },
    [disabled, authorName, slug, allowVideo]
  );

  const accept = allowVideo
    ? { ...IMAGE_ACCEPT, ...VIDEO_ACCEPT }
    : { ...IMAGE_ACCEPT };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    disabled,
    multiple: true,
    validator: (file) => {
      const mimeType = resolveFileMime(file);
      if (isVideoMime(mimeType) && !allowVideo) {
        return { code: "video-not-allowed", message: "Video nije u paketu" };
      }
      if (file.size > maxSizeForMime(mimeType)) {
        return { code: "file-too-large", message: "Fajl je prevelik" };
      }
      return null;
    },
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      if (code === "file-too-large") {
        toast.error(allowVideo ? sr.guest.formats : "JPG, PNG, WEBP do 15 MB");
      } else if (code === "video-not-allowed") {
        toast.error("Video nije uključen u vaš paket");
      } else {
        toast.error(sr.toast.uploadFailed);
      }
    },
  });

  const removeItem = (id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="author">{sr.guest.yourName}</Label>
        <Input
          id="author"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="npr. Ana"
          className="mt-1.5"
          disabled={disabled}
        />
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition",
          isDragActive
            ? "border-[#C4A574] bg-[#FAF7F2]"
            : "border-slate-200 bg-slate-50/50 hover:border-[#C4A574]/60 hover:bg-[#FAF7F2]/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <CloudUpload className="mx-auto mb-3 h-10 w-10 text-[#C4A574]" />
        <p className="font-medium text-slate-800">
          {isDragActive ? sr.guest.dropActive : sr.guest.dropMedia}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {allowVideo ? sr.guest.formats : "JPG, PNG, WEBP do 15 MB"}
        </p>
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
            <p className="mt-1 text-xs text-slate-500">
              {item.status === "pending" && sr.guest.statusPending}
              {item.status === "uploading" && sr.guest.statusUploading}
              {item.status === "done" && sr.guest.statusDone}
              {item.status === "error" && sr.guest.statusError}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
