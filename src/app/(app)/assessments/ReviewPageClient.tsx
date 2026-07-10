"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TeacherClassSubject } from "@/lib/data/teaching";
import type { ReviewAssignmentRow, StudentSubmissionRow, QuizResultRow } from "@/lib/data/review";
import { ReviewTugasTab } from "./ReviewTugasTab";
import { QuizResultsTab } from "./QuizResultsTab";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

export function ReviewPageClient({
  combos,
  assignmentsByKey,
  submissionsByAssignmentId,
  quizResultsByKey,
}: {
  combos: TeacherClassSubject[];
  assignmentsByKey: Record<string, ReviewAssignmentRow[]>;
  submissionsByAssignmentId: Record<string, StudentSubmissionRow[]>;
  quizResultsByKey: Record<string, QuizResultRow[]>;
}) {
  const [selectedKey, setSelectedKey] = useState(comboKey(combos[0].classId, combos[0].subjectId));
  const assignments = assignmentsByKey[selectedKey] ?? [];
  const quizResults = quizResultsByKey[selectedKey] ?? [];

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-0 p-6 shadow-soft">
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
      </Card>

      <Tabs defaultValue="tugas">
        <TabsList>
          <TabsTrigger value="tugas">Periksa Tugas</TabsTrigger>
          <TabsTrigger value="kuis">Hasil Kuis</TabsTrigger>
        </TabsList>
        <TabsContent value="tugas" className="mt-4">
          <ReviewTugasTab
            assignments={assignments}
            submissionsByAssignmentId={submissionsByAssignmentId}
          />
        </TabsContent>
        <TabsContent value="kuis" className="mt-4">
          <QuizResultsTab quizResults={quizResults} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
