"use client";

import { useMemo, useState } from "react";
import { Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Student = {
  id: string;
  name: string;
  nisn: string | null;
  classId: string | null;
  className: string | null;
};
type ClassOption = { id: string; name: string };

export function StudentsPanel({
  students,
  classes,
}: {
  students: Student[];
  classes: ClassOption[];
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;

  const rows = useMemo(() => {
    if (searching) {
      const q = query.trim().toLowerCase();
      return students.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.nisn ?? "").toLowerCase().includes(q),
      );
    }
    return students.filter((s) => s.classId === classId);
  }, [students, classId, query, searching]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button className="rounded-xl">+ Tambah Siswa</Button>
        <Button variant="outline" className="rounded-xl">
          <Upload className="mr-2 h-4 w-4" /> Import Excel
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama/NISN..."
              className="w-56 rounded-xl pl-9"
            />
          </div>
        </div>
      </div>
      {searching && (
        <p className="text-xs text-muted-foreground">
          Menampilkan hasil pencarian dari semua kelas.
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">NISN</th>
              {searching && <th className="px-4 py-3">Kelas</th>}
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.nisn ?? "-"}</td>
                {searching && <td className="px-4 py-3">{s.className ?? "-"}</td>}
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" className="rounded-lg">
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={searching ? 4 : 3}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  {searching ? "Tidak ditemukan." : "Belum ada siswa di kelas ini."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
