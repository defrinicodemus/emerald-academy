"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StudentSubmissionRow } from "@/lib/data/review";
import { gradeSubmission } from "./actions";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-lg" disabled={disabled}>
          Periksa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Periksa Tugas</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-2xl bg-muted/40 p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Hasil Pengerjaan
            </div>
            <div className="font-semibold">{student.studentName}</div>
            <div className="text-xs text-muted-foreground">{assignmentTitle}</div>
            <div className="text-xs text-muted-foreground">
              {student.submittedAt
                ? `Dikumpulkan ${new Date(student.submittedAt).toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}`
                : "Belum dikumpulkan"}
            </div>
            <div className="mt-3">
              {student.contentUrl ? (
                isImageUrl(student.contentUrl) ? (
                  <img
                    src={student.contentUrl}
                    alt="Hasil pengerjaan"
                    className="max-h-64 w-full rounded-xl object-cover"
                  />
                ) : (
                  <a
                    href={student.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Lihat jawaban siswa →
                  </a>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada jawaban.</p>
              )}
            </div>
          </div>

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
                rows={6}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Nilai"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
