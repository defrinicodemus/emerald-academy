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
import { FileText, Image as ImageIcon, Video, Type, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeacherClassSubject } from "@/lib/data/teaching";
import type { LearningObjectiveRow } from "@/lib/data/curriculum";
import type { MaterialKind, MaterialRow } from "@/lib/data/classroom";
import { createMaterial, updateMaterial, deleteMaterial } from "./actions";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

const KIND_LABEL: Record<MaterialKind, string> = {
  text: "Teks",
  pdf: "PDF",
  image: "Gambar",
  video: "Video YouTube",
};

const KIND_ICON: Record<MaterialKind, typeof FileText> = {
  text: Type,
  pdf: FileText,
  image: ImageIcon,
  video: Video,
};

export function MaterialsTab({
  combos,
  materialsByKey,
  objectivesByKey,
}: {
  combos: TeacherClassSubject[];
  materialsByKey: Record<string, MaterialRow[]>;
  objectivesByKey: Record<string, LearningObjectiveRow[]>;
}) {
  const [selectedKey, setSelectedKey] = useState(comboKey(combos[0].classId, combos[0].subjectId));
  const selectedCombo = combos.find((c) => comboKey(c.classId, c.subjectId) === selectedKey)!;
  const materials = materialsByKey[selectedKey] ?? [];
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
          <AddMaterialDialog
            classId={selectedCombo.classId}
            subjectId={selectedCombo.subjectId}
            objectives={objectives}
          />
        </div>
      </Card>

      <Card className="rounded-3xl border-0 p-2 shadow-soft">
        <div className="space-y-1">
          {materials.map((m) => (
            <MaterialListItem key={m.id} material={m} objectives={objectives} />
          ))}
          {materials.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Belum ada materi.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function AddMaterialDialog({
  classId,
  subjectId,
  objectives,
}: {
  classId: string;
  subjectId: string;
  objectives: LearningObjectiveRow[];
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<MaterialKind>("text");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    formData.set("class_id", classId);
    formData.set("subject_id", subjectId);
    formData.set("kind", kind);
    startTransition(async () => {
      const result = await createMaterial(formData);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        formRef.current?.reset();
        setKind("text");
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
          + Tambah Materi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Materi</DialogTitle>
        </DialogHeader>
        {noObjectives ? (
          <p className="text-sm text-muted-foreground">
            Belum ada Tujuan Pembelajaran (TP) untuk kelas & mapel ini. Isi dulu lewat menu Kelola
            Kurikulum.
          </p>
        ) : (
          <form ref={formRef} action={handleSubmit} className="space-y-3">
            <div>
              <Label>Jenis Materi</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as MaterialKind)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Teks</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Gambar</SelectItem>
                  <SelectItem value="video">Video YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Judul</Label>
              <Input name="title" className="mt-1" required />
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

            {kind === "text" && (
              <div>
                <Label>Isi Materi</Label>
                <Textarea name="content" rows={6} className="mt-1" required />
              </div>
            )}
            {kind === "video" && (
              <div>
                <Label>Tautan YouTube</Label>
                <Input
                  name="url"
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Video akan ditampilkan langsung di halaman, siswa tidak perlu buka YouTube.
                </p>
              </div>
            )}
            {(kind === "pdf" || kind === "image") && (
              <div>
                <Label>Unggah {kind === "pdf" ? "PDF" : "Gambar"}</Label>
                <Input
                  name="file"
                  type="file"
                  accept={kind === "pdf" ? "application/pdf" : "image/png,image/jpeg,image/webp"}
                  className="mt-1"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Materi"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MaterialListItem({
  material,
  objectives,
}: {
  material: MaterialRow;
  objectives: LearningObjectiveRow[];
}) {
  const Icon = KIND_ICON[material.kind];
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(material.title);
  const [learningObjectiveId, setLearningObjectiveId] = useState(
    material.learningObjectiveId ?? "",
  );

  function toggleExpanded() {
    setExpanded((v) => !v);
    setEditing(false);
    setTitle(material.title);
    setLearningObjectiveId(material.learningObjectiveId ?? "");
  }

  function handleSaveChanges() {
    const formData = new FormData();
    formData.set("id", material.id);
    formData.set("title", title);
    formData.set("learning_objective_id", learningObjectiveId);
    startTransition(async () => {
      const result = await updateMaterial(formData);
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
      const result = await deleteMaterial(material.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

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
          <div className="truncate font-semibold">{material.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">{KIND_LABEL[material.kind]}</span>
            {material.learningObjectiveTitle && (
              <span className="truncate rounded-full bg-muted px-2 py-0.5">
                {material.learningObjectiveTitle}
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
          <MaterialPreview material={material} />

          {editing ? (
            <div className="space-y-3">
              <div>
                <Label>Judul</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
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
            <div className="text-sm text-muted-foreground">
              Diunggah{" "}
              {new Date(material.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
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
                  <AlertDialogTitle>Hapus materi &quot;{material.title}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>Aksi ini tidak bisa dibatalkan.</AlertDialogDescription>
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

function MaterialPreview({ material }: { material: MaterialRow }) {
  if (material.kind === "text") {
    return (
      <p className="line-clamp-4 whitespace-pre-line rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
        {material.content}
      </p>
    );
  }
  if (material.kind === "image" && material.url) {
    return (
      <img
        src={material.url}
        alt={material.title}
        className="max-h-48 w-full rounded-xl object-cover"
      />
    );
  }
  if (material.kind === "video" && material.url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl">
        <iframe
          src={material.url}
          title={material.title}
          className="h-full w-full"
          allowFullScreen
        />
      </div>
    );
  }
  if (material.kind === "pdf" && material.url) {
    return (
      <div className="overflow-hidden rounded-xl border">
        <iframe src={material.url} title={material.title} className="h-56 w-full" />
      </div>
    );
  }
  return null;
}
