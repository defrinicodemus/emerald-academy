import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STUDENTS, TEACHERS } from "@/lib/mock-data";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/_app/users")({ component: UsersPage });

function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon="👥" title="Manajemen Pengguna" subtitle="Kelola akun guru, siswa, dan kepala sekolah" />
      <Tabs defaultValue="siswa">
        <TabsList className="rounded-2xl bg-muted p-1">
          <TabsTrigger value="siswa" className="rounded-xl">Siswa</TabsTrigger>
          <TabsTrigger value="guru" className="rounded-xl">Guru</TabsTrigger>
          <TabsTrigger value="kepsek" className="rounded-xl">Kepala Sekolah</TabsTrigger>
        </TabsList>

        <TabsContent value="siswa" className="mt-4">
          <Card className="rounded-3xl border-0 p-6 shadow-soft">
            <div className="mb-4 flex flex-wrap gap-2">
              <Button className="rounded-xl">+ Tambah Siswa</Button>
              <Button variant="outline" className="rounded-xl"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
            </div>
            <SimpleTable cols={["Nama", "NISN", "Kelas", "Aksi"]} rows={STUDENTS.map((s) => [s.name, s.nisn, "Kelas 4A", "Edit"])} />
          </Card>
        </TabsContent>

        <TabsContent value="guru" className="mt-4">
          <Card className="rounded-3xl border-0 p-6 shadow-soft">
            <div className="mb-4"><Button className="rounded-xl">+ Tambah Guru</Button></div>
            <SimpleTable cols={["Nama", "NIP", "Mata Pelajaran", "Aksi"]} rows={TEACHERS.map((t) => [t.name, t.nip, t.subject, "Edit"])} />
          </Card>
        </TabsContent>

        <TabsContent value="kepsek" className="mt-4">
          <Card className="rounded-3xl border-0 p-6 shadow-soft">
            <div className="mb-4"><Button className="rounded-xl">+ Tambah Kepala Sekolah</Button></div>
            <SimpleTable cols={["Nama", "NIP", "Email", "Aksi"]} rows={[["Yohanes Bele", "197003121995011001", "kepsek@nggodimeda.sch.id", "Edit"]]} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SimpleTable({ cols, rows }: { cols: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>{cols.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/30">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {j === r.length - 1 ? <Button size="sm" variant="ghost" className="rounded-lg">{cell}</Button> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
