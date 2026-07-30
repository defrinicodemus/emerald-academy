"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import type { AssignmentContentRow } from "@/lib/data/subjects";
import { submitAssignment } from "../../actions";
import { formatDueDate } from "../../formatDueDate";

export function TugasDetailContent({ assignment }: { assignment: AssignmentContentRow }) {
  const [a, setA] = useState(assignment);
  const [answer, setAnswer] = useState(assignment.submissionContent ?? "");
  const [isPending, startTransition] = useTransition();
  const locked = a.status === "graded";

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitAssignment(a.id, answer);
      if (result.ok) {
        toast.success(result.message);
        setA((prev) => ({ ...prev, status: "submitted", submissionContent: answer.trim() }));
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4 rounded-3xl border-0 bg-card p-6 shadow-soft">
      {a.description && (
        <div
          className="rich-text-content rounded-xl bg-muted/40 p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: a.description }}
        />
      )}

      {a.attachmentImageUrl && (
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Lampiran dari Guru
          </Label>
          <ul className="mt-1.5 space-y-1.5">
            <li className="rounded-lg border px-3 py-1.5 text-sm">
              <a
                href={a.attachmentImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{a.attachmentImageName ?? "Lampiran"}</span>
              </a>
            </li>
          </ul>
        </div>
      )}

      <div className="text-xs text-muted-foreground">Tenggat: {formatDueDate(a.dueAt)}</div>

      {locked && a.score != null && (
        <div className="rounded-2xl bg-primary-soft/40 p-4">
          <div className="font-display text-2xl font-bold text-primary">
            ✨ Nilai: {a.score}/100
          </div>
          {a.teacherComment && (
            <div className="mt-3 rounded-xl bg-card p-3 text-sm">
              <div className="text-xs font-medium text-primary">💬 Catatan Motivasi dari Guru</div>
              <p className="mt-1 text-muted-foreground">{a.teacherComment}</p>
            </div>
          )}
        </div>
      )}

      {!locked && (
        <div className="space-y-2">
          <Label>Jawaban / Tautan Hasil Kerja Kamu</Label>
          <Textarea
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tulis jawabanmu di sini, atau tempel tautan foto/audio hasil kerjamu..."
          />
          <Button
            className="w-full rounded-xl"
            disabled={isPending || !answer.trim()}
            onClick={handleSubmit}
          >
            {isPending ? "Mengirim..." : a.status === "submitted" ? "Kirim Ulang" : "Kirim Tugas"}
          </Button>
          {a.status === "submitted" && (
            <p className="text-center text-xs text-muted-foreground">Menunggu penilaian guru...</p>
          )}
        </div>
      )}
    </div>
  );
}
