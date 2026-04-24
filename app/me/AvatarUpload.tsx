"use client";

import { useRef, useState, useCallback, useTransition } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

type Props = {
  userId: string;
  currentUrl: string | null;
  letter: string;
  color: string;
};

function centerSquareCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
    width,
    height
  );
}

async function getCroppedBlob(img: HTMLImageElement, crop: Crop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  const size = 400;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cropX = (crop.x / 100) * img.width * scaleX;
  const cropY = (crop.y / 100) * img.height * scaleY;
  const cropW = (crop.width / 100) * img.width * scaleX;
  const cropH = (crop.height / 100) * img.height * scaleY;

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, size, size);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.88));
}

export default function AvatarUpload({ userId, currentUrl, letter, color }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [srcForCrop, setSrcForCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("圖片不能超過 10MB"); return; }
    const url = URL.createObjectURL(file);
    setSrcForCrop(url);
    setCrop(undefined);
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  }, []);

  async function handleConfirm() {
    if (!imgRef.current || !crop) return;
    setUploading(true);

    const blob = await getCroppedBlob(imgRef.current, crop);
    const supabase = createClient();
    const path = `${userId}/avatar.jpg`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

    if (error) {
      alert("上傳失敗：" + error.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: urlWithBust }).eq("id", userId);

    setPreview(urlWithBust);
    setSrcForCrop(null);
    setUploading(false);
    startTransition(() => router.refresh());
  }

  function handleCancel() {
    setSrcForCrop(null);
  }

  return (
    <>
      {/* 頭像點擊觸發 */}
      <div className="relative group cursor-pointer flex-shrink-0" onClick={() => inputRef.current?.click()}>
        <Avatar letter={letter} color={color} avatarUrl={preview} size={64} />
        <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* 裁切 Modal */}
      {srcForCrop && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-black/[0.06]">
              <p className="text-[16px] font-medium text-[#1F1E1B]">裁切頭像</p>
              <p className="text-[13px] text-[#9B9891] mt-0.5">拖動調整要保留的範圍</p>
            </div>

            <div className="flex items-center justify-center bg-[#F3F1EB]" style={{ maxHeight: "55vh", overflow: "hidden" }}>
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                aspect={1}
                circularCrop
                minWidth={30}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={srcForCrop}
                  alt="裁切預覽"
                  onLoad={onImageLoad}
                  style={{ maxHeight: "55vh", maxWidth: "100%", display: "block" }}
                />
              </ReactCrop>
            </div>

            <div className="p-4 flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 border border-black/10 rounded-xl py-2.5 text-[15px] text-[#6B6862] hover:bg-[#F3F1EB] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={uploading}
                className="flex-1 bg-[#2C2C2A] text-white rounded-xl py-2.5 text-[15px] disabled:opacity-50"
              >
                {uploading ? "上傳中…" : "確認"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
