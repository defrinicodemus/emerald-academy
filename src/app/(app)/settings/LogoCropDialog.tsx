"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const STAGE_SIZE = 340;
const CROP_SIZE = 260;
const OUTPUT_SIZE = 512;

type Pan = { x: number; y: number };

function clampPan(pan: Pan, zoom: number, naturalWidth: number, naturalHeight: number): Pan {
  const maxX = Math.max(0, (naturalWidth * zoom - CROP_SIZE) / 2);
  const maxY = Math.max(0, (naturalHeight * zoom - CROP_SIZE) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

export function LogoCropDialog({
  open,
  onOpenChange,
  file,
  onCropped,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onCropped: (file: File) => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<{ startX: number; startY: number; startPan: Pan } | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setNaturalSize(null);
    setPan({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const min = CROP_SIZE / Math.min(w, h);
    setNaturalSize({ w, h });
    setMinZoom(min);
    setZoom(min);
    setPan({ x: 0, y: 0 });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!naturalSize) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, startPan: pan };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current || !naturalSize) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const next = {
      x: dragState.current.startPan.x + dx,
      y: dragState.current.startPan.y + dy,
    };
    setPan(clampPan(next, zoom, naturalSize.w, naturalSize.h));
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleZoomChange([value]: number[]) {
    if (!naturalSize) return;
    setZoom(value);
    setPan((prev) => clampPan(prev, value, naturalSize.w, naturalSize.h));
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !naturalSize) return;
    const sSize = CROP_SIZE / zoom;
    const sx = naturalSize.w / 2 - CROP_SIZE / (2 * zoom) - pan.x / zoom;
    const sy = naturalSize.h / 2 - CROP_SIZE / (2 * zoom) - pan.y / zoom;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    // Jangan fillRect warna latar di sini — biarkan transparan supaya alpha PNG/WEBP asli terbawa.
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCropped(new File([blob], "logo.png", { type: "image/png" }));
    }, "image/png");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-md">
        <DialogHeader>
          <DialogTitle>Sesuaikan Logo</DialogTitle>
        </DialogHeader>

        {objectUrl && (
          <>
            <div
              className="relative mx-auto touch-none select-none overflow-hidden rounded-md bg-transparency-grid"
              style={{ width: STAGE_SIZE, height: STAGE_SIZE, cursor: "grab" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <img
                ref={imgRef}
                src={objectUrl}
                alt="Pratinjau logo"
                draggable={false}
                onLoad={handleImageLoad}
                className={cn("absolute max-w-none max-h-none", !naturalSize && "invisible")}
                style={
                  naturalSize
                    ? {
                        left: STAGE_SIZE / 2 - naturalSize.w / 2,
                        top: STAGE_SIZE / 2 - naturalSize.h / 2,
                        width: naturalSize.w,
                        height: naturalSize.h,
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: "center center",
                      }
                    : undefined
                }
              />
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm ring-2 ring-white/80"
                style={{
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                }}
              />
            </div>

            <div className="px-1">
              <Slider
                value={[zoom]}
                min={minZoom}
                max={minZoom * 4}
                step={(minZoom * 3) / 100}
                onValueChange={handleZoomChange}
                disabled={!naturalSize}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Geser untuk memindahkan, gunakan slider untuk memperbesar/memperkecil.
            </p>
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={!naturalSize}
            onClick={handleConfirm}
          >
            Gunakan Foto Ini
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
