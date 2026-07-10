"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Mic, Camera, Type, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeacherClassSubject } from "@/lib/data/teaching";
import type { LearningObjectiveRow } from "@/lib/data/curriculum";
import type { AssignmentKind, AssignmentRow } from "@/lib/data/classroom";
import { createAssignment, updateAssignment, deleteAssignment } from "./actions";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

const KIND_LABEL: Record<AssignmentKind, string> = {
  essay: "Esai",
  photo: "Foto",
  audio: "Suara",
  text: "Teks",
};

const KIND_ICON: Record<AssignmentKind, typeof FileText> = {
  essay: FileText,
  photo: Camera,
  audio: Mic,
  text: Type,
};

function formatDueDate(dueAt: string | null): string | null {
  if (!dueAt) return null;
  return new Date(dueAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AssignmentsTab({
  combos,
  assignmentsByKey,
  objectivesByKey,
}: {
  combos: TeacherClassSubject[];
  assignmentsByKey: Record<string, AssignmentRow[]>;
  objectivesByKey: Record<string, LearningObjectiveRow[]>;
}) {
  const [selectedKey, setSelectedKey] = useState(comboKey(combos[0].classId, combos[0].subjectId));
  const selectedCombo = combos.find((c) => comboKey(c.classId, c.subjectId) === selectedKey)!;
  const assignments = assignmentsByKey[selectedKey] ?? [];
  const objectives = objectivesByKey[selectedKey] ?? [];

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Label>Kelas & Mata Pelajaran</Label>
            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="mt-1 w-full sm:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {combos.map((c) => (
                  <SelectItem
                    key={comboKey(c.classId, c.subjectId)}
                    value={comboKey(c.classId, c.subjectId)}
                  >
                    {c.className} · {c.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AddAssignmentDialog
            classId={selectedCombo.classId}
            subjectId={selectedCombo.subjectId}
            objectives={objectives}
          />
        </div>
      </Card>

      <Card className="rounded-3xl border-0 p-2 shadow-soft">
        <div className="space-y-1">
          {assignments.map((a) => (
            <AssignmentListItem key={a.id} assignment={a} objectives={objectives} />
          ))}
          {assignments.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Belum ada tugas.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function AddAssignmentDialog({
  classId,
  subjectId,
  objectives,
}: {
  classId: string;
  subjectId: string;
  objectives: LearningObjectiveRow[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    formData.set("class_id", classId);
    formData.set("subject_id", subjectId);
    startTransition(async () => {
      const result = await createAssignment(formData);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        formRef.current?.reset();
      } else {
        toast.error(result.message);
      }
    });
  }

  const noObjectives = objectives.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-lg">
          + Tambah Tugas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Tugas</DialogTitle>
        </DialogHeader>
        {noObjectives ? (
          <p className="text-sm text-muted-foreground">
            Belum ada Tujuan Pembelajaran (TP) untuk kelas & mapel ini. Isi dulu lewat menu Kelola
            Kurikulum.
          </p>
        ) : (
          <form ref={formRef} action={handleSubmit} className="space-y-3">
            <div>
              <Label>Judul Tugas</Label>
              <Input name="title" className="mt-1" required />
            </div>
            <div>
              <Label>Jenis Tugas</Label>
              <Select name="kind" defaultValue="text" required>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Teks</SelectItem>
                  <SelectItem value="essay">Esai</SelectItem>
                  <SelectItem value="photo">Foto</SelectItem>
                  <SelectItem value="audio">Suara</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Format hasil kerja yang diharapkan dari siswa.
              </p>
            </div>
            <div>
              <Label>Instruksi Tugas</Label>
              <Textarea name="description" rows={5} className="mt-1" />
            </div>
            <div>
              <Label>Tenggat Waktu</Label>
              <Input name="due_at" type="date" className="mt-1" />
            </div>
            <div>
              <Label>Tujuan Pembelajaran (TP)</Label>
              <Select name="learning_objective_id" required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih TP" />
                </SelectTrigger>
                <SelectContent>
                  {objectives.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Tugas"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignmentListItem({
  assignment,
  objectives,
}: {
  assignment: AssignmentRow;
  objectives: LearningObjectiveRow[];
}) {
  const Icon = KIND_ICON[assignment.kind];
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description ?? "");
  const [dueAt, setDueAt] = useState(assignment.dueAt ? assignment.dueAt.slice(0, 10) : "");
  const [learningObjectiveId, setLearningObjectiveId] = useState(
    assignment.learningObjectiveId ?? "",
  );

  function resetFields() {
    setTitle(assignment.title);
    setDescription(assignment.description ?? "");
    setDueAt(assignment.dueAt ? assignment.dueAt.slice(0, 10) : "");
    setLearningObjectiveId(assignment.learningObjectiveId ?? "");
  }

  function toggleExpanded() {
    setExpanded((v) => !v);
    setEditing(false);
    resetFields();
  }

  function handleSaveChanges() {
    const formData = new FormData();
    formData.set("id", assignment.id);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("due_at", dueAt);
    formData.set("learning_objective_id", learningObjectiveId);
    startTransition(async () => {
      const result = await updateAssignment(formData);
      if (result.ok) {
        toast.success(result.message);
        setEditing(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAssignment(assignment.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  const dueLabel = formatDueDate(assignment.dueAt);

  return (
    <div className="rounded-2xl border">
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/40"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft/50">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{assignment.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">{KIND_LABEL[assignment.kind]}</span>
            {assignment.learningObjectiveTitle && (
              <span className="truncate rounded-full bg-muted px-2 py-0.5">
                {assignment.learningObjectiveTitle}
              </span>
            )}
            {dueLabel && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-warning">
                Tenggat {dueLabel}
              </span>
            )}
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
        <div className="space-y-3 border-t p-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label>Judul Tugas</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Instruksi Tugas</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tenggat Waktu</Label>
                <Input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tujuan Pembelajaran (TP)</Label>
                <Select value={learningObjectiveId} onValueChange={setLearningObjectiveId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih TP" />
                  </SelectTrigger>
                  <SelectContent>
                    {objectives.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-line rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
              {assignment.description || "Tidak ada instruksi tambahan."}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {editing ? (
              <Button
                size="sm"
                className="rounded-lg"
                disabled={isPending || !title.trim() || !learningObjectiveId}
                onClick={handleSaveChanges}
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-lg text-destructive">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus tugas &quot;{assignment.title}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Aksi ini tidak bisa dibatalkan. Tugas hanya bisa dihapus jika belum ada siswa
                    yang mengumpulkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
