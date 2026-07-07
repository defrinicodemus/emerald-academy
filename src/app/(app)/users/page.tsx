import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listStudentsWithAvg, listTeachersWithStats, getPrincipal } from "@/lib/data/people";
import { listClasses } from "@/lib/data/school";
import { StudentsPanel } from "./StudentsPanel";
import { TeachersPanel } from "./TeachersPanel";

export default async function UsersPage() {
  const [students, teachers, principal, classes] = await Promise.all([
    listStudentsWithAvg(),
    listTeachersWithStats(),
    getPrincipal(),
    listClasses(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon="👥"
        title="Manajemen Pengguna"
        subtitle="Kelola akun guru, siswa, dan kepala sekolah"
      />
      <Tabs defaultValue="siswa">
        <TabsList className="rounded-2xl bg-muted p-1">
          <TabsTrigger value="siswa" className="rounded-xl">
            Siswa
          </TabsTrigger>
          <TabsTrigger value="guru" className="rounded-xl">
            Guru
          </TabsTrigger>
          <TabsTrigger value="kepsek" className="rounded-xl">
            Kepala Sekolah
          </TabsTrigger>
        </TabsList>

        <TabsContent value="siswa" className="mt-4">
          <Card className="rounded-3xl border-0 p-6 shadow-soft">
            <StudentsPanel students={students} classes={classes} />
          </Card>
        </TabsContent>

        <TabsContent value="guru" className="mt-4">
          <Card className="rounded-3xl border-0 p-6 shadow-soft">
            <TeachersPanel teachers={teachers} />
          </Card>
        </TabsContent>

        <TabsContent value="kepsek" className="mt-4">
          <Card className="rounded-3xl border-0 p-6 shadow-soft">
            <div className="mb-4">
              <Button className="rounded-xl">+ Tambah Kepala Sekolah</Button>
            </div>
            <SimpleTable
              cols={["Nama", "NIP", "Aksi"]}
              rows={principal ? [[principal.full_name, principal.nip ?? "-", "Edit"]] : []}
            />
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
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-4 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/30">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {j === r.length - 1 ? (
                    <Button size="sm" variant="ghost" className="rounded-lg">
                      {cell}
                    </Button>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
