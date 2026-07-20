"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { TeacherClassSubject, CurriculumPlanData } from "@/lib/data/curriculum";
import {
  saveCurriculumPlan,
  addLearningObjective,
  updateLearningObjective,
  deleteLearningObjective,
  moveLearningObjective,
} from "./actions";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

export function CurriculumManager({
  combos,
  plansByKey,
}: {
  combos: TeacherClassSubject[];
  plansByKey: Record<string, CurriculumPlanData>;
}) {
  const [selectedKey, setSelectedKey] = useState(comboKey(combos[0].classId, combos[0].subjectId));
  const selectedCombo = combos.find((c) => comboKey(c.classId, c.subjectId) === selectedKey)!;
  const plan = plansByKey[selectedKey] ?? { cpText: "", objectives: [] };

  const [cpText, setCpText] = useState(plan.cpText);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCpText(plan.cpText);
  }, [selectedKey, plan.cpText]);

  function handleSaveCp() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("class_id", selectedCombo.classId);
      formData.set("subject_id", selectedCombo.subjectId);
      formData.set("cp_text", cpText);
      const result = await saveCurriculumPlan(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handleAddObjective() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("class_id", selectedCombo.classId);
      formData.set("subject_id", selectedCombo.subjectId);
      formData.set("title", newTitle.trim());
      const result = await addLearningObjective(formData);
      if (result.ok) {
        toast.success(result.message);
        setNewTitle("");
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleUpdateObjective(id: string, title: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("title", title);
      const result = await updateLearningObjective(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handleDeleteObjective(id: string) {
    startTransition(async () => {
      const result = await deleteLearningObjective(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveLearningObjective(id, direction);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <Label className="text-xs">Kelas & Mata Pelajaran</Label>
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
      </Card>

      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <h2 className="font-display text-base font-bold @sm:text-lg @md:text-xl">
          Capaian Pembelajaran (CP)
        </h2>
        <Textarea
          value={cpText}
          onChange={(e) => setCpText(e.target.value)}
          rows={5}
          className="mt-3 text-sm"
          placeholder="Tuliskan capaian pembelajaran untuk kelas & mapel ini..."
        />
        <Button className="mt-3 rounded-md text-sm" disabled={isPending} onClick={handleSaveCp}>
          {isPending ? "Menyimpan..." : "Simpan CP"}
        </Button>
      </Card>

      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <h2 className="font-display text-base font-bold @sm:text-lg @md:text-xl">
          Alur Tujuan Pembelajaran (ATP)
        </h2>
        <div className="mt-4 space-y-2">
          {plan.objectives.map((o, i) => (
            <ObjectiveRow
              key={o.id}
              index={i}
              objective={o}
              isFirst={i === 0}
              isLast={i === plan.objectives.length - 1}
              disabled={isPending}
              onUpdate={handleUpdateObjective}
              onDelete={handleDeleteObjective}
              onMove={handleMove}
            />
          ))}
          {plan.objectives.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada Tujuan Pembelajaran.</p>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={`TP ${plan.objectives.length + 1}: ...`}
            className="min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddObjective();
              }
            }}
          />
          <Button
            className="shrink-0 rounded-md text-sm"
            disabled={isPending || !newTitle.trim()}
            onClick={handleAddObjective}
          >
            + Tambah TP
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ObjectiveRow({
  index,
  objective,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onDelete,
  onMove,
}: {
  index: number;
  objective: { id: string; title: string };
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  const [title, setTitle] = useState(objective.title);
  const [editing, setEditing] = useState(false);

  return (
    <div className="@container flex items-center gap-1.5 rounded-md border p-2 @xs:gap-2 @xs:p-2.5 @sm:p-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft/50 text-[11px] font-bold @xs:h-8 @xs:w-8 @xs:text-xs">
        {index + 1}
      </div>
      {editing ? (
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (title.trim() && title !== objective.title) onUpdate(objective.id, title.trim());
          }}
          autoFocus
          className="min-w-0 flex-1 text-xs @xs:text-sm"
        />
      ) : (
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-xs font-medium hover:underline @xs:text-sm"
          onClick={() => setEditing(true)}
        >
          {objective.title}
        </button>
      )}
      <div className="flex shrink-0 items-center gap-0.5 @xs:gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 @xs:h-8 @xs:w-8"
          disabled={disabled || isFirst}
          onClick={() => onMove(objective.id, "up")}
        >
          <ArrowUp className="h-3.5 w-3.5 @xs:h-4 @xs:w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 @xs:h-8 @xs:w-8"
          disabled={disabled || isLast}
          onClick={() => onMove(objective.id, "down")}
        >
          <ArrowDown className="h-3.5 w-3.5 @xs:h-4 @xs:w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive @xs:h-8 @xs:w-8"
              disabled={disabled}
            >
              <Trash2 className="h-3.5 w-3.5 @xs:h-4 @xs:w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus TP ini?</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{objective.title}&quot; akan dihapus dari ATP. Aksi ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(objective.id)}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
