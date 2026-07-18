import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/data/profile";
import { getSchoolReportData } from "@/lib/data/schoolReport";
import { getSchool } from "@/lib/data/school";
import { SchoolReportPdfDocument } from "@/lib/pdf/SchoolReportPdfDocument";

export const runtime = "nodejs";

const SEMESTER_LABEL: Record<"ganjil" | "genap", string> = {
  ganjil: "Ganjil",
  genap: "Genap",
};

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yearId = request.nextUrl.searchParams.get("yearId") ?? undefined;
  const [school, data] = await Promise.all([getSchool(), getSchoolReportData(yearId)]);

  if (!data) {
    return NextResponse.json({ error: "Belum ada tahun ajaran" }, { status: 404 });
  }

  const selectedOption = data.yearOptions.find((y) => y.id === data.selectedYearId);
  const printedAt = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const buffer = await renderToBuffer(
    <SchoolReportPdfDocument
      schoolName={school?.name ?? "Sekolah"}
      schoolLogoUrl={school?.logo_url ?? null}
      yearLabel={selectedOption?.yearLabel ?? "-"}
      semesterLabel={selectedOption ? SEMESTER_LABEL[selectedOption.semester] : "-"}
      printedAt={printedAt}
      data={data}
    />,
  );

  const fileYear = (selectedOption?.yearLabel ?? "periode").replace("/", "-");
  const fileSemester = selectedOption?.semester ?? "";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="laporan-sekolah-${fileYear}-${fileSemester}.pdf"`,
    },
  });
}
