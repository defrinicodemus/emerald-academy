"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ResponsiveDialogContent } from "@/components/ResponsiveDialogContent";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import type { StudentSubmissionRow } from "@/lib/data/review";
import { gradeSubmission } from "./actions";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url);
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="rounded-md"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="rounded-md"
          onClick={() => setScale((s) => Math.min(3, s + 0.25))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="rounded-md"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `scale(${scale})` }}
        className="max-h-[85vh] max-w-[85vw] cursor-zoom-in object-contain transition-transform duration-150"
      />
    </div>
  );
}

export function GradeSplitDialog({
  assignmentTitle,
  student,
  disabled,
}: {
  assignmentTitle: string;
  student: StudentSubmissionRow;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("submission_id", student.submissionId ?? "");
    startTransition(async () => {
      const result = await gradeSubmission(formData);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  const isImage = student.contentUrl ? isImageUrl(student.contentUrl) : false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-md" disabled={disabled}>
          Periksa
        </Button>
      </DialogTrigger>
      <ResponsiveDialogContent title={`${assignmentTitle} - ${student.studentName}`}>
        <div className="grid flex-1 grid-cols-1 sm:grid-cols-10 sm:overflow-hidden">
          <div className="space-y-4 border-b p-4 sm:col-span-7 sm:overflow-y-auto sm:border-b-0 sm:border-r">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Hasil Pengerjaan
              </div>
              <div className="mt-1 text-sm font-semibold">{student.studentName}</div>
              <div className="text-xs text-muted-foreground">
                {student.submittedAt
                  ? `Dikumpulkan ${new Date(student.submittedAt).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}`
                  : "Belum dikumpulkan"}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="text-sm font-semibold">Hasil Kerja</div>
              {student.contentUrl && !isImage && (
                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-sm">
                  {student.contentUrl}
                </div>
              )}
              {student.contentUrl && isImage && (
                <>
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="block w-40"
                  >
                    <img
                      src={student.contentUrl}
                      alt="Hasil pengerjaan"
                      className="aspect-square w-full cursor-zoom-in rounded-md border object-cover"
                    />
                  </button>
                  {lightboxOpen && (
                    <ImageLightbox
                      src={student.contentUrl}
                      alt="Hasil pengerjaan"
                      onClose={() => setLightboxOpen(false)}
                    />
                  )}
                </>
              )}
              {!student.contentUrl && (
                <p className="text-sm text-muted-foreground">Belum ada jawaban.</p>
              )}
            </div>
          </div>

          <div className="p-4 sm:col-span-3 sm:overflow-y-auto">
            <form action={handleSubmit} className="space-y-3">
              <div>
                <Label>Nilai (0-100)</Label>
                <Input
                  name="score"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={student.score ?? undefined}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Catatan / Umpan Balik</Label>
                <Textarea
                  name="teacher_comment"
                  defaultValue={student.teacherComment ?? ""}
                  rows={8}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full rounded-md" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Nilai"}
              </Button>
            </form>
          </div>
        </div>
      </ResponsiveDialogContent>
    </Dialog>
  );
}
