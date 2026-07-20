"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ExpandRegion } from "@/components/ExpandRegion";
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
import {
  FileText,
  Image as ImageIcon,
  Video,
  Type,
  Presentation,
  Trash2,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { extractYoutubeId, extractGoogleSlidesId } from "@/lib/materialEmbeds";
import { richTextIsEmpty } from "@/lib/richTextEmpty";
import type { TeacherClassSubject } from "@/lib/data/teaching";
import type { LearningObjectiveRow } from "@/lib/data/curriculum";
import type { MaterialKind, MaterialRow } from "@/lib/data/classroom";
import { createMaterial, updateMaterial, deleteMaterial, setMaterialActive } from "./actions";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

const KIND_LABEL: Record<MaterialKind, string> = {
  text: "Teks",
  pdf: "PDF",
  image: "Gambar",
  video: "Video YouTube",
  slideshow: "Slideshow Presentasi",
};

const KIND_ICON: Record<MaterialKind, typeof FileText> = {
  text: Type,
  pdf: FileText,
  image: ImageIcon,
  video: Video,
  slideshow: Presentation,
};

const ADD_MATERIAL_KEY = "__add_material__";

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
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const selectedCombo = combos.find((c) => comboKey(c.classId, c.subjectId) === selectedKey)!;
  const materials = materialsByKey[selectedKey] ?? [];
  const objectives = objectivesByKey[selectedKey] ?? [];

  function toggle(key: string) {
    setExpandedKey((current) => (current === key ? null : key));
  }

  return (
    <div className="space-y-6">
      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <div>
          <Label className="text-xs">Kelas & Mata Pelajaran</Label>
          <Select
            value={selectedKey}
            onValueChange={(v) => {
              setSelectedKey(v);
              setExpandedKey(null);
            }}
          >
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
      </Card>

      <AddMaterialCard
        classId={selectedCombo.classId}
        subjectId={selectedCombo.subjectId}
        objectives={objectives}
        isExpanded={expandedKey === ADD_MATERIAL_KEY}
        onToggle={() => toggle(ADD_MATERIAL_KEY)}
      />

      <Card className="rounded-md border-0 p-2 shadow-soft">
        <div className="space-y-1">
          {materials.map((m) => (
            <MaterialListItem
              key={m.id}
              material={m}
              objectives={objectives}
              isExpanded={expandedKey === m.id}
              onToggle={() => toggle(m.id)}
            />
          ))}
          {materials.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Belum ada materi.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function EmptyPreviewHint({ text }: { text: string }) {
  return <p className="px-2 py-8 text-center text-xs text-muted-foreground">{text}</p>;
}

function LivePreview({
  kind,
  youtubeId,
  slidesId,
  filePreviewUrl,
}: {
  kind: MaterialKind;
  youtubeId: string | null;
  slidesId: string | null;
  filePreviewUrl: string | null;
}) {
  if (kind === "video") {
    return youtubeId ? (
      <div className="aspect-video w-full overflow-hidden rounded-md">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          className="h-full w-full"
          allowFullScreen
          title="Pratinjau video"
        />
      </div>
    ) : (
      <EmptyPreviewHint text="Masukkan tautan YouTube yang valid untuk melihat pratinjau." />
    );
  }
  if (kind === "slideshow") {
    return slidesId ? (
      <div className="aspect-video w-full overflow-hidden rounded-md">
        <iframe
          src={`https://docs.google.com/presentation/d/${slidesId}/embed`}
          className="h-full w-full"
          allowFullScreen
          title="Pratinjau slideshow"
        />
      </div>
    ) : (
      <EmptyPreviewHint text="Masukkan tautan Google Slides yang valid untuk melihat pratinjau." />
    );
  }
  if (kind === "image") {
    return filePreviewUrl ? (
      <img
        src={filePreviewUrl}
        alt="Pratinjau gambar"
        className="max-h-64 w-full rounded-md object-contain"
      />
    ) : (
      <EmptyPreviewHint text="Pilih gambar untuk melihat pratinjau." />
    );
  }
  if (kind === "pdf") {
    return filePreviewUrl ? (
      <iframe
        src={filePreviewUrl}
        className="h-64 w-full rounded-md border"
        title="Pratinjau PDF"
      />
    ) : (
      <EmptyPreviewHint text="Pilih file PDF untuk melihat pratinjau." />
    );
  }
  return null;
}

function AddMaterialCard({
  classId,
  subjectId,
  objectives,
  isExpanded,
  onToggle,
}: {
  classId: string;
  subjectId: string;
  objectives: LearningObjectiveRow[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [kind, setKind] = useState<MaterialKind>("text");
  const [videoUrl, setVideoUrl] = useState("");
  const [slidesUrl, setSlidesUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editorKey, setEditorKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function resetForm() {
    formRef.current?.reset();
    setKind("text");
    setVideoUrl("");
    setSlidesUrl("");
    setFile(null);
    setEditorKey((k) => k + 1);
  }

  function handleSubmit(status: "draft" | "published") {
    if (!formRef.current) return;
    if (!formRef.current.reportValidity()) return;

    const formData = new FormData(formRef.current);
    formData.set("class_id", classId);
    formData.set("subject_id", subjectId);
    formData.set("kind", kind);
    formData.set("status", status);
    startTransition(async () => {
      const result = await createMaterial(formData);
      if (result.ok) {
        toast.success(result.message);
        resetForm();
        onToggle();
      } else {
        toast.error(result.message);
      }
    });
  }

  const noObjectives = objectives.length === 0;
  const youtubeId = kind === "video" ? extractYoutubeId(videoUrl) : null;
  const slidesId = kind === "slideshow" ? extractGoogleSlidesId(slidesUrl) : null;

  return (
    <Card className="@container overflow-hidden rounded-md border-0 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 @sm:p-6">
        <div>
          <h3 className="font-display text-base font-bold @sm:text-lg @md:text-xl">
            Tambah Materi Pembelajaran
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Gunakan editor bawaan untuk membuat materi teks atau menambahkan PDF, gambar, video
            YouTube, dan slideshow presentasi.
          </p>
        </div>
        <Button type="button" variant="outline" className="shrink-0 rounded-md" onClick={onToggle}>
          {isExpanded ? "Tutup Form" : "Buka Form"}
          {isExpanded ? (
            <ChevronUp className="ml-1.5 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-1.5 h-4 w-4" />
          )}
        </Button>
      </div>

      <ExpandRegion expanded={isExpanded}>
        <div className="space-y-4 border-t px-4 pb-4 pt-4 @sm:px-6 @sm:pb-6">
          {noObjectives ? (
            <p className="text-sm text-muted-foreground">
              Belum ada Tujuan Pembelajaran (TP) untuk kelas & mapel ini. Isi dulu lewat menu Kelola
              Kurikulum.
            </p>
          ) : (
            <form ref={formRef} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                      <SelectItem value="slideshow">Slideshow Presentasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Judul</Label>
                  <Input name="title" className="mt-1" required />
                </div>
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
                  <div className="mt-1">
                    <RichTextEditor
                      key={editorKey}
                      name="content"
                      placeholder="Tulis materi pelajaran Anda di sini..."
                    />
                  </div>
                </div>
              )}
              {kind === "video" && (
                <div>
                  <Label>Tautan YouTube</Label>
                  <Input
                    name="url"
                    placeholder="https://youtube.com/watch?v=..."
                    className="mt-1"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Video akan ditampilkan langsung di halaman, siswa tidak perlu buka YouTube.
                  </p>
                </div>
              )}
              {kind === "slideshow" && (
                <div>
                  <Label>Tautan Google Slides</Label>
                  <Input
                    name="url"
                    placeholder="https://docs.google.com/presentation/d/xxxx"
                    className="mt-1"
                    value={slidesUrl}
                    onChange={(e) => setSlidesUrl(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Gunakan tautan Google Slides yang telah dipublikasikan agar dapat ditampilkan
                    kepada siswa.
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
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </div>
              )}

              {kind !== "text" && (
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Pratinjau
                  </Label>
                  <div className="mt-2 rounded-md border bg-muted/20 p-3">
                    <LivePreview
                      kind={kind}
                      youtubeId={youtubeId}
                      slidesId={slidesId}
                      filePreviewUrl={filePreviewUrl}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-md"
                  disabled={isPending}
                  onClick={() => handleSubmit("draft")}
                >
                  {isPending ? "Menyimpan..." : "Simpan Draft"}
                </Button>
                <Button
                  type="button"
                  className="rounded-md"
                  disabled={isPending}
                  onClick={() => handleSubmit("published")}
                >
                  {isPending ? "Menyimpan..." : "Publikasikan Materi"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </ExpandRegion>
    </Card>
  );
}

function MaterialListItem({
  material,
  objectives,
  isExpanded,
  onToggle,
}: {
  material: MaterialRow;
  objectives: LearningObjectiveRow[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = KIND_ICON[material.kind];
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(material.title);
  const [learningObjectiveId, setLearningObjectiveId] = useState(
    material.learningObjectiveId ?? "",
  );
  const [content, setContent] = useState(material.content ?? "");
  const [editorKey, setEditorKey] = useState(0);

  function handleToggle() {
    setEditing(false);
    setTitle(material.title);
    setLearningObjectiveId(material.learningObjectiveId ?? "");
    setContent(material.content ?? "");
    setEditorKey((k) => k + 1);
    onToggle();
  }

  function handleSaveChanges() {
    const formData = new FormData();
    formData.set("id", material.id);
    formData.set("title", title);
    formData.set("learning_objective_id", learningObjectiveId);
    if (material.kind === "text") {
      formData.set("content", content);
    }
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

  function handleToggleActive() {
    startTransition(async () => {
      const result = await setMaterialActive(material.id, !material.isActive);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="@container rounded-md border">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/40"
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary-soft/50 @sm:h-9 @sm:w-9">
          <Icon className="h-3.5 w-3.5 @sm:h-4 @sm:w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{material.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-0.5">{KIND_LABEL[material.kind]}</span>
            {material.learningObjectiveTitle && (
              <span className="truncate rounded-md bg-muted px-2 py-0.5">
                {material.learningObjectiveTitle}
              </span>
            )}
            {!material.isActive && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                Nonaktif
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      <ExpandRegion expanded={isExpanded}>
        <div className="space-y-3 border-t p-4">
          {!(editing && material.kind === "text") && <MaterialPreview material={material} />}

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
              {material.kind === "text" && (
                <div>
                  <Label>Isi Materi</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      key={editorKey}
                      name="content"
                      defaultValue={material.content ?? ""}
                      onChange={setContent}
                    />
                  </div>
                </div>
              )}
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
                className="rounded-md"
                disabled={
                  isPending ||
                  !title.trim() ||
                  !learningObjectiveId ||
                  (material.kind === "text" && richTextIsEmpty(content))
                }
                onClick={handleSaveChanges}
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-md"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="rounded-md"
              disabled={isPending}
              onClick={handleToggleActive}
            >
              {material.isActive ? (
                <>
                  <EyeOff className="mr-1.5 h-4 w-4" /> Nonaktifkan
                </>
              ) : (
                <>
                  <Eye className="mr-1.5 h-4 w-4" /> Aktifkan
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-md text-destructive">
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
      </ExpandRegion>
    </div>
  );
}

function MaterialPreview({ material }: { material: MaterialRow }) {
  if (material.kind === "text") {
    return (
      <div
        className="rich-text-content max-h-64 overflow-y-auto rounded-md bg-muted/40 p-3 text-sm text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: material.content ?? "" }}
      />
    );
  }
  if (material.kind === "image" && material.url) {
    return (
      <img
        src={material.url}
        alt={material.title}
        className="max-h-48 w-full rounded-md object-cover"
      />
    );
  }
  if (material.kind === "video" && material.url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-md">
        <iframe
          src={material.url}
          title={material.title}
          className="h-full w-full"
          allowFullScreen
        />
      </div>
    );
  }
  if (material.kind === "slideshow" && material.url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-md">
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
      <div className="overflow-hidden rounded-md border">
        <iframe src={material.url} title={material.title} className="h-56 w-full" />
      </div>
    );
  }
  return null;
}
