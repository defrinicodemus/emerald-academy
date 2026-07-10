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
import {
  ListChecks,
  Trash2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Check,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeacherClassSubject } from "@/lib/data/teaching";
import type { LearningObjectiveRow } from "@/lib/data/curriculum";
import type { QuestionType, QuizQuestionRow, QuizRow } from "@/lib/data/classroom";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  addQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  moveQuizQuestion,
} from "./actions";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: "Pilihan Ganda",
  short_answer: "Isian Singkat",
};

export function QuizzesTab({
  combos,
  quizzesByKey,
  questionsByQuizId,
  objectivesByKey,
}: {
  combos: TeacherClassSubject[];
  quizzesByKey: Record<string, QuizRow[]>;
  questionsByQuizId: Record<string, QuizQuestionRow[]>;
  objectivesByKey: Record<string, LearningObjectiveRow[]>;
}) {
  const [selectedKey, setSelectedKey] = useState(comboKey(combos[0].classId, combos[0].subjectId));
  const selectedCombo = combos.find((c) => comboKey(c.classId, c.subjectId) === selectedKey)!;
  const quizzes = quizzesByKey[selectedKey] ?? [];
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
          <AddQuizDialog
            classId={selectedCombo.classId}
            subjectId={selectedCombo.subjectId}
            objectives={objectives}
          />
        </div>
      </Card>

      <Card className="rounded-3xl border-0 p-2 shadow-soft">
        <div className="space-y-1">
          {quizzes.map((q) => (
            <QuizListItem
              key={q.id}
              quiz={q}
              questions={questionsByQuizId[q.id] ?? []}
              objectives={objectives}
            />
          ))}
          {quizzes.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Belum ada kuis.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function AddQuizDialog({
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
      const result = await createQuiz(formData);
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
          + Buat Kuis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Kuis</DialogTitle>
        </DialogHeader>
        {noObjectives ? (
          <p className="text-sm text-muted-foreground">
            Belum ada Tujuan Pembelajaran (TP) untuk kelas & mapel ini. Isi dulu lewat menu Kelola
            Kurikulum.
          </p>
        ) : (
          <form ref={formRef} action={handleSubmit} className="space-y-3">
            <div>
              <Label>Judul Kuis</Label>
              <Input name="title" className="mt-1" required />
            </div>
            <div>
              <Label>Instruksi (opsional)</Label>
              <Textarea name="description" rows={3} className="mt-1" />
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
              {isPending ? "Menyimpan..." : "Buat Kuis"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Setelah kuis dibuat, tambahkan soal-soalnya lewat panel yang terbuka di daftar kuis.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuizListItem({
  quiz,
  questions,
  objectives,
}: {
  quiz: QuizRow;
  questions: QuizQuestionRow[];
  objectives: LearningObjectiveRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description ?? "");
  const [dueAt, setDueAt] = useState(quiz.dueAt ? quiz.dueAt.slice(0, 10) : "");
  const [learningObjectiveId, setLearningObjectiveId] = useState(quiz.learningObjectiveId ?? "");

  function resetFields() {
    setTitle(quiz.title);
    setDescription(quiz.description ?? "");
    setDueAt(quiz.dueAt ? quiz.dueAt.slice(0, 10) : "");
    setLearningObjectiveId(quiz.learningObjectiveId ?? "");
  }

  function toggleExpanded() {
    setExpanded((v) => !v);
    setEditing(false);
    resetFields();
  }

  function handleSaveChanges() {
    const formData = new FormData();
    formData.set("id", quiz.id);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("due_at", dueAt);
    formData.set("learning_objective_id", learningObjectiveId);
    startTransition(async () => {
      const result = await updateQuiz(formData);
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
      const result = await deleteQuiz(quiz.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishQuiz(quiz.id);
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
          <ListChecks className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{quiz.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-medium",
                quiz.isPublished ? "bg-primary-soft/60 text-primary" : "bg-warning/15 text-warning",
              )}
            >
              {quiz.isPublished ? "Terkirim ke Siswa" : "Draf"}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">{quiz.questionCount} soal</span>
            {quiz.learningObjectiveTitle && (
              <span className="truncate rounded-full bg-muted px-2 py-0.5">
                {quiz.learningObjectiveTitle}
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
        <div className="space-y-4 border-t p-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label>Judul Kuis</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Instruksi</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
            quiz.description && (
              <p className="whitespace-pre-line rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                {quiz.description}
              </p>
            )
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
                  <AlertDialogTitle>Hapus kuis &quot;{quiz.title}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Aksi ini tidak bisa dibatalkan. Semua soal di kuis ini akan ikut terhapus. Kuis
                    hanya bisa dihapus jika belum ada siswa yang mengerjakan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="border-t pt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold">Bank Soal</h3>
              <div className="flex items-center gap-2">
                <AddQuestionDialog assignmentId={quiz.id} />
                {!quiz.isPublished && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="rounded-lg" disabled={isPending}>
                        <UploadCloud className="mr-1.5 h-4 w-4" /> Upload Kuis
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Upload kuis ke siswa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Kuis dengan {quiz.questionCount} soal ini akan langsung bisa dikerjakan
                          siswa. Pastikan semua soal sudah lengkap sebelum mengunggah.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePublish}>Upload</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <QuestionRow
                  key={q.id}
                  index={i}
                  question={q}
                  isFirst={i === 0}
                  isLast={i === questions.length - 1}
                />
              ))}
              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada soal di kuis ini.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddQuestionDialog({ assignmentId }: { assignmentId: string }) {
  const [open, setOpen] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType>("multiple_choice");
  const [numOptions, setNumOptions] = useState(2);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    formData.set("assignment_id", assignmentId);
    formData.set("question_type", questionType);
    if (questionType === "multiple_choice") {
      formData.set("correct_index", String(correctIndex));
    }
    startTransition(async () => {
      const result = await addQuizQuestion(formData);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        formRef.current?.reset();
        setNumOptions(2);
        setCorrectIndex(0);
        setQuestionType("multiple_choice");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-lg">
          + Tambah Soal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Soal</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div>
            <Label>Tipe Soal</Label>
            <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                <SelectItem value="short_answer">Isian Singkat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pertanyaan</Label>
            <Textarea name="question_text" rows={3} className="mt-1" required />
          </div>

          {questionType === "short_answer" ? (
            <div>
              <Label>Jawaban Benar</Label>
              <Input name="correct_answer_text" className="mt-1" required />
              <p className="mt-1 text-xs text-muted-foreground">
                Dipakai untuk koreksi otomatis (harus cocok persis, tidak peka huruf besar/kecil).
              </p>
            </div>
          ) : (
            <div>
              <Label>Opsi Jawaban</Label>
              <div className="mt-1 space-y-2">
                {Array.from({ length: numOptions }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_index_radio"
                      checked={correctIndex === i}
                      onChange={() => setCorrectIndex(i)}
                      aria-label={`Opsi ${i + 1} benar`}
                    />
                    <Input name="option_text" placeholder={`Opsi ${i + 1}`} className="flex-1" />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Tandai bulatan di kiri untuk opsi yang benar.
                </p>
                {numOptions < 6 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setNumOptions((n) => n + 1)}
                  >
                    + Tambah Opsi
                  </Button>
                )}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan Soal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuestionRow({
  index,
  question,
  isFirst,
  isLast,
}: {
  index: number;
  question: QuizQuestionRow;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [questionText, setQuestionText] = useState(question.questionText);
  const [correctAnswerText, setCorrectAnswerText] = useState(question.correctAnswerText ?? "");

  function handleSave() {
    const formData = new FormData();
    formData.set("id", question.id);
    formData.set("question_text", questionText);
    if (question.questionType === "short_answer") {
      formData.set("correct_answer_text", correctAnswerText);
    }
    startTransition(async () => {
      const result = await updateQuizQuestion(formData);
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
      const result = await deleteQuizQuestion(question.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveQuizQuestion(question.id, direction);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-start gap-2">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft/50 text-xs font-bold">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              className="text-sm"
            />
          ) : (
            <div className="text-sm font-medium">{question.questionText}</div>
          )}
          <div className="mt-1">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {QUESTION_TYPE_LABEL[question.questionType]}
            </span>
          </div>

          {question.questionType === "multiple_choice" ? (
            <ul className="mt-2 space-y-1">
              {question.options.map((o) => (
                <li
                  key={o.id}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    o.isCorrect ? "font-semibold text-primary" : "text-muted-foreground",
                  )}
                >
                  {o.isCorrect && <Check className="h-3 w-3 shrink-0" />}
                  {o.text}
                </li>
              ))}
            </ul>
          ) : editing ? (
            <div className="mt-2">
              <Label className="text-xs">Jawaban Benar</Label>
              <Input
                value={correctAnswerText}
                onChange={(e) => setCorrectAnswerText(e.target.value)}
                className="mt-1"
              />
            </div>
          ) : (
            <div className="mt-1 text-xs text-primary">
              Jawaban benar: {question.correctAnswerText}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={isPending || isFirst}
            onClick={() => handleMove("up")}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={isPending || isLast}
            onClick={() => handleMove("down")}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          {editing ? (
            <Button
              size="sm"
              className="h-7 rounded-lg px-2 text-xs"
              disabled={isPending}
              onClick={handleSave}
            >
              Simpan
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg px-2 text-xs"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus soal ini?</AlertDialogTitle>
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
    </div>
  );
}
