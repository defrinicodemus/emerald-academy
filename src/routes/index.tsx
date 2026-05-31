import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SD Inpres Nggodimeda — LMS" },
      { name: "description", content: "Sistem belajar daring SD Inpres Nggodimeda — ceria, ramah anak, dan terhubung." },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("lms_auth_user") : null;
    window.location.replace(raw ? "/dashboard" : "/login");
  }, []);
  return null;
}
