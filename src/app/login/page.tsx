import { Suspense } from "react";
import type { Metadata } from "next";
import { getSchool } from "@/lib/data/school";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Masuk — SD Inpres Nggodimeda",
  description: "Masuk ke LMS SD Inpres Nggodimeda untuk murid, guru, kepala sekolah, dan admin.",
};

export default async function LoginPage() {
  const school = await getSchool();

  return (
    <Suspense fallback={null}>
      <LoginForm schoolName={school?.name ?? null} logoUrl={school?.logo_url ?? null} />
    </Suspense>
  );
}
