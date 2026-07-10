import { createClient } from "@/lib/supabase/server";
import { appliesToGrade } from "@/lib/data/subjects";

export type AttendanceStatus = "hadir" | "sakit" | "izin" | "alfa";

export interface AttendanceStudentRow {
  studentId: string;
  fullName: string;
  nisn: string | null;
  avatar: string | null;
  status: AttendanceStatus;
}

export interface TpOption {
  id: string;
  title: string;
}

export interface MeetingData {
  meetingId: string | null;
  meetingDate: string;
  materialTaught: string;
  learningObjectiveId: string | null;
  notes: string;
  students: AttendanceStudentRow[];
  tpOptions: TpOption[];
}

export interface AttendanceRecapRow {
  studentId: string;
  fullName: string;
  nisn: string | null;
  statusByMeeting: Record<number, AttendanceStatus | null>;
}

export interface AttendanceRecap {
  meetingNumbers: number[];
  students: AttendanceRecapRow[];
}

export async function getAttendanceRecap(
  classId: string,
  subjectId: string,
): Promise<AttendanceRecap> {
  const supabase = await createClient();

  const [{ data: students }, { data: meetings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, nisn")
      .eq("class_id", classId)
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("class_meetings")
      .select("id, meeting_number")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .order("meeting_number"),
  ]);

  const meetingNumbers = (meetings ?? []).map((m) => m.meeting_number);
  const meetingIds = (meetings ?? []).map((m) => m.id);
  const meetingNumberByMeetingId = new Map((meetings ?? []).map((m) => [m.id, m.meeting_number]));

  const { data: records } =
    meetingIds.length > 0
      ? await supabase
          .from("attendance_records")
          .select("meeting_id, student_id, status")
          .in("meeting_id", meetingIds)
      : {
          data: [] as { meeting_id: string; student_id: string; status: AttendanceStatus }[],
        };

  const statusMap = new Map<string, AttendanceStatus>();
  for (const r of records ?? []) {
    const meetingNumber = meetingNumberByMeetingId.get(r.meeting_id);
    if (meetingNumber == null) continue;
    statusMap.set(`${r.student_id}:${meetingNumber}`, r.status);
  }

  const rows: AttendanceRecapRow[] = (students ?? []).map((st) => ({
    studentId: st.id,
    fullName: st.full_name,
    nisn: st.nisn,
    statusByMeeting: Object.fromEntries(
      meetingNumbers.map((n) => [n, statusMap.get(`${st.id}:${n}`) ?? null]),
    ),
  }));

  return { meetingNumbers, students: rows };
}

export interface StudentMeetingRow {
  meetingNumber: number;
  meetingDate: string;
  status: AttendanceStatus | null;
}

export interface StudentSubjectAttendance {
  subjectId: string;
  subjectName: string;
  meetings: StudentMeetingRow[];
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alfaCount: number;
  percentHadir: number;
}

export async function getStudentAttendance(
  studentId: string,
  classId: string | null,
): Promise<StudentSubjectAttendance[]> {
  if (!classId) return [];
  const supabase = await createClient();

  const [{ data: subjects }, { data: klass }] = await Promise.all([
    supabase.from("subjects").select("id, name, min_grade, max_grade").order("name"),
    supabase.from("classes").select("grade_level").eq("id", classId).single(),
  ]);
  const gradeLevel = klass?.grade_level ?? null;
  const visibleSubjects = (subjects ?? []).filter((s) =>
    appliesToGrade(gradeLevel, s.min_grade, s.max_grade),
  );

  const { data: meetings } = await supabase
    .from("class_meetings")
    .select("id, subject_id, meeting_number, meeting_date")
    .eq("class_id", classId)
    .order("meeting_number");

  const meetingIds = (meetings ?? []).map((m) => m.id);
  const { data: records } =
    meetingIds.length > 0
      ? await supabase
          .from("attendance_records")
          .select("meeting_id, status")
          .eq("student_id", studentId)
          .in("meeting_id", meetingIds)
      : { data: [] as { meeting_id: string; status: AttendanceStatus }[] };

  const statusByMeetingId = new Map((records ?? []).map((r) => [r.meeting_id, r.status]));

  const meetingsBySubject = new Map<string, StudentMeetingRow[]>();
  for (const m of meetings ?? []) {
    const arr = meetingsBySubject.get(m.subject_id) ?? [];
    arr.push({
      meetingNumber: m.meeting_number,
      meetingDate: m.meeting_date,
      status: statusByMeetingId.get(m.id) ?? null,
    });
    meetingsBySubject.set(m.subject_id, arr);
  }

  return visibleSubjects.map((s) => {
    const meetingsForSubject = (meetingsBySubject.get(s.id) ?? []).sort(
      (a, b) => a.meetingNumber - b.meetingNumber,
    );
    let hadirCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let alfaCount = 0;
    for (const m of meetingsForSubject) {
      if (m.status === "hadir") hadirCount++;
      else if (m.status === "sakit") sakitCount++;
      else if (m.status === "izin") izinCount++;
      else if (m.status === "alfa") alfaCount++;
    }
    const totalRecorded = hadirCount + sakitCount + izinCount + alfaCount;
    return {
      subjectId: s.id,
      subjectName: s.name,
      meetings: meetingsForSubject,
      hadirCount,
      sakitCount,
      izinCount,
      alfaCount,
      percentHadir: totalRecorded > 0 ? Math.round((hadirCount / totalRecorded) * 100) : 0,
    };
  });
}

export async function getFilledMeetingNumbers(
  classId: string,
  subjectId: string,
): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_meetings")
    .select("meeting_number")
    .eq("class_id", classId)
    .eq("subject_id", subjectId);
  return (data ?? []).map((m) => m.meeting_number);
}

export async function getMeetingData(
  classId: string,
  subjectId: string,
  meetingNumber: number,
): Promise<MeetingData> {
  const supabase = await createClient();

  const [{ data: plan }, { data: students }, { data: meeting }] = await Promise.all([
    supabase
      .from("curriculum_plans")
      .select("id")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name, nisn, avatar_emoji")
      .eq("class_id", classId)
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("class_meetings")
      .select("id, meeting_date, material_taught, learning_objective_id, notes")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .eq("meeting_number", meetingNumber)
      .maybeSingle(),
  ]);

  let tpOptions: TpOption[] = [];
  if (plan) {
    const { data: objectives } = await supabase
      .from("learning_objectives")
      .select("id, title")
      .eq("curriculum_plan_id", plan.id)
      .order("sort_order");
    tpOptions = (objectives ?? []).map((o) => ({ id: o.id, title: o.title }));
  }

  const statusByStudent = new Map<string, AttendanceStatus>();
  if (meeting) {
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .eq("meeting_id", meeting.id);
    for (const r of records ?? []) {
      statusByStudent.set(r.student_id, r.status);
    }
  }

  const studentRows: AttendanceStudentRow[] = (students ?? []).map((st) => ({
    studentId: st.id,
    fullName: st.full_name,
    nisn: st.nisn,
    avatar: st.avatar_emoji,
    status: statusByStudent.get(st.id) ?? "hadir",
  }));

  return {
    meetingId: meeting?.id ?? null,
    meetingDate: meeting?.meeting_date ?? new Date().toISOString().slice(0, 10),
    materialTaught: meeting?.material_taught ?? "",
    learningObjectiveId: meeting?.learning_objective_id ?? null,
    notes: meeting?.notes ?? "",
    students: studentRows,
    tpOptions,
  };
}
