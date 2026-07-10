"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText, Camera, Mic, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewAssignmentRow, StudentSubmissionRow } from "@/lib/data/review";
import { GradeSplitDialog } from "./GradeSplitDialog";

const KIND_LABEL: Record<string, string> = {
  essay: "Esai",
  photo: "Foto",
  audio: "Suara",
  text: "Teks",
};

const KIND_ICON: Record<string, typeof FileText> = {
  essay: FileText,
  photo: Camera,
  audio: Mic,
  text: Type,
};

const STATUS_LABEL: Record<string, string> = {
  belum: "Belum Mengumpulkan",
  dikerjakan: "Sedang Dikerjakan",
  submitted: "Menunggu Dinilai",
  graded: "Sudah Dinilai",
};

const STATUS_STYLE: Record<string, string> = {
  belum: "bg-muted text-muted-foreground",
  dikerjakan: "bg-muted text-muted-foreground",
  submitted: "bg-warning/15 text-warning",
  graded: "bg-primary-soft/60 text-primary",
};

export function ReviewTugasTab({
  assignments,
  submissionsByAssignmentId,
}: {
  assignments: ReviewAssignmentRow[];
  submissionsByAssignmentId: Record<string, StudentSubmissionRow[]>;
}) {
  return (
    <Card className="rounded-3xl border-0 p-2 shadow-soft">
      <div className="space-y-1">
        {assignments.map((a) => (
          <AssignmentReviewRow
            key={a.id}
            assignment={a}
            students={submissionsByAssignmentId[a.id] ?? []}
          />
        ))}
        {assignments.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            Belum ada tugas untuk kelas & mapel ini.
          </p>
        )}
      </div>
    </Card>
  );
}

function AssignmentReviewRow({
  assignment,
  students,
}: {
  assignment: ReviewAssignmentRow;
  students: StudentSubmissionRow[];
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = KIND_ICON[assignment.kind] ?? FileText;

  return (
    <div className="rounded-2xl border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/40"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft/50">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{assignment.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">
              {KIND_LABEL[assignment.kind] ?? assignment.kind}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              {assignment.gradedCount}/{assignment.totalStudents} dinilai
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              {assignment.submittedCount}/{assignment.totalStudents} mengumpulkan
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-2 border-t p-4">
          {students.map((s) => (
            <div
              key={s.studentId}
              className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft/50 text-lg">
                {s.avatar ?? "🙂"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{s.studentName}</div>
                {s.score != null && (
                  <div className="text-xs text-muted-foreground">Nilai: {s.score}</div>
                )}
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  STATUS_STYLE[s.status],
                )}
              >
                {STATUS_LABEL[s.status] ?? s.status}
              </span>
              <GradeSplitDialog
                assignmentTitle={assignment.title}
                student={s}
                disabled={!s.submissionId}
              />
            </div>
          ))}
          {students.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada siswa di kelas ini.</p>
          )}
        </div>
      )}
    </div>
  );
}
