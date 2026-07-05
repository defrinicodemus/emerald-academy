"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { Sparkles, GraduationCap, ShieldCheck, Star } from "lucide-react";
import { login } from "./actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submitDemo = (demoUsername: string) => {
    const fd = new FormData();
    fd.set("username", demoUsername);
    fd.set("password", `${demoUsername}123`);
    login(fd);
  };

  return (
    <div className="min-h-screen bg-background bg-grain">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 md:items-center md:gap-12 md:px-8">
        {/* Hero */}
        <section className="order-2 md:order-1">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-primary-foreground shadow-glow md:p-10">
            <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-accent/30 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5" /> LMS Ramah Anak
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">
                Belajar ceria di
                <br />
                <span className="text-accent">SD Inpres Nggodimeda</span>
              </h1>
              <p className="mt-4 max-w-md text-sm text-primary-foreground/85 md:text-base">
                Materi, tugas, kuis, dan bintang penghargaan — semua dalam satu tempat hangat
                untuk murid, guru, dan kepala sekolah.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { i: GraduationCap, t: "6 Kelas" },
                  { i: Star, t: "Gamifikasi" },
                  { i: ShieldCheck, t: "Aman" },
                ].map((x, i) => (
                  <div key={i} className="rounded-2xl bg-white/10 p-3 text-center backdrop-blur">
                    <x.i className="mx-auto h-5 w-5" />
                    <div className="mt-1 text-xs font-medium">{x.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="order-1 md:order-2">
          <div className="rounded-3xl border bg-card p-6 shadow-soft md:p-8">
            <div className="mb-6">
              <div className="inline-grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold">Selamat datang kembali</h2>
              <p className="text-sm text-muted-foreground">Masuk untuk melanjutkan belajar.</p>
            </div>

            <form className="space-y-4" action={login}>
              <div className="space-y-1.5">
                <Label htmlFor="u">Nama Pengguna</Label>
                <Input
                  id="u"
                  name="username"
                  placeholder="contoh: budi"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {err && <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
              <Button type="submit" className="h-11 w-full rounded-xl text-base font-semibold shadow-soft">
                Masuk
              </Button>
              <button type="button" className="block w-full text-center text-xs text-muted-foreground hover:text-primary">
                Lupa kata sandi?
              </button>
            </form>

            <div className="mt-6 rounded-2xl border bg-muted/40 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Akun Demo (klik untuk masuk)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.username}
                    type="button"
                    onClick={() => submitDemo(a.username)}
                    className="rounded-xl border bg-card px-3 py-2 text-left text-xs font-medium transition hover:border-primary hover:bg-primary-soft/40"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
