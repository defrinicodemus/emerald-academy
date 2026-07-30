"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, BookOpen, ClipboardList, ShieldCheck, Copyright } from "lucide-react";
import { cn } from "@/lib/utils";
import { login } from "./actions";

export function LoginForm({
  schoolName,
  logoUrl,
}: {
  schoolName: string | null;
  logoUrl: string | null;
}) {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grain md:h-screen md:overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-6 md:grid md:grid-cols-2 md:items-center md:gap-12 md:overflow-hidden md:px-8 md:py-6 lg:gap-16 lg:px-12">
        {/* Hero */}
        <section className="md:max-h-full md:overflow-hidden">
          <div className="relative overflow-hidden rounded-t-3xl gradient-primary px-6 pb-16 pt-8 text-primary-foreground shadow-glow md:rounded-3xl md:p-8 lg:p-10">
            <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-accent/30 blur-2xl" />
            <div className="relative flex flex-col items-center text-center md:block md:text-left">
              <div
                className={cn(
                  "grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[10px] text-primary-foreground md:mx-auto md:mb-5 md:h-28 md:w-28 lg:h-32 lg:w-32",
                  logoUrl ? "bg-transparent" : "bg-white/15",
                )}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={schoolName ?? "Logo sekolah"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Sparkles className="h-10 w-10" />
                )}
              </div>

              {/* Mobile-only brand line */}
              <div className="mt-3 text-base font-semibold md:hidden">LMS SD Inpres Nggodimeda</div>

              {/* Desktop-only marketing content */}
              <div className="hidden md:block">
                <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-center md:text-4xl">
                  Belajar di
                  <br />
                  <span className="text-accent">{schoolName ?? "SD Inpres Nggodimeda"}</span>
                </h1>
                <p className="mt-4 max-w-md text-sm text-primary-foreground/85 md:text-base">
                  Learning Management System yang membantu guru mengajar dan peserta didik belajar
                  lebih mudah dalam satu platform.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 lg:gap-4">
                  {[
                    { i: BookOpen, t: "Materi Digital", d: "Belajar kapan saja" },
                    { i: ClipboardList, t: "Tugas & Kuis", d: "Semua dalam satu tempat" },
                    { i: ShieldCheck, t: "Aman & Mudah", d: "Dirancang untuk sekolah" },
                  ].map((x, i) => (
                    <div key={i} className="rounded-2xl bg-white/10 p-3 text-center backdrop-blur">
                      <x.i className="mx-auto h-5 w-5 text-white" />
                      <div className="mt-1 text-xs font-medium">{x.t}</div>
                      <div className="mt-0.5 text-[10px] text-primary-foreground/70">{x.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="relative z-10 -mt-10 md:mt-0">
          <div className="rounded-3xl border bg-card p-6 shadow-soft md:p-8 lg:p-10">
            <div className="mb-6 text-center md:text-left">
              <h2 className="font-display text-2xl font-bold lg:text-3xl">Selamat datang</h2>
              <p className="text-sm text-muted-foreground">
                Masuk Untuk Melakukan Pembelajaran di LMS <br /> SD Inpres Nggodimeda
              </p>
            </div>

            <form className="space-y-4" action={login}>
              <div className="space-y-1.5">
                <Label htmlFor="u">Username / ID</Label>
                <Input
                  id="u"
                  name="username"
                  placeholder="NIP / NISN"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p">Kata Sandi</Label>
                <Input
                  id="p"
                  name="password"
                  type="password"
                  placeholder="Sandi Dari Admin Sekolah"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {err && (
                <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {err}
                </div>
              )}
              <Button
                type="submit"
                className="h-11 w-full rounded-xl text-base font-semibold shadow-soft"
              >
                Masuk
              </Button>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="block w-full text-center text-xs text-muted-foreground hover:text-primary"
              >
                Lupa kata sandi?
              </button>
            </form>
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-1.5 pb-8 text-xs text-muted-foreground md:pb-4">
        <Copyright className="h-3.5 w-3.5" />
        <span>{new Date().getFullYear()} LMS SD Inpres Nggodimeda</span>
      </footer>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent
          onClick={() => setForgotOpen(false)}
          className="max-w-sm cursor-pointer rounded-2xl text-center"
        >
          <DialogHeader>
            <DialogTitle className="text-center">Lupa Kata Sandi?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Silakan hubungi Admin LMS, Wali Kelas Anda untuk melakukan reset Sandi.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
