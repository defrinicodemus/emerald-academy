import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Masuk — SD Inpres Nggodimeda",
  description: "Masuk ke LMS SD Inpres Nggodimeda untuk murid, guru, kepala sekolah, dan admin.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
