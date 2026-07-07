import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getMasterKelasData } from "@/lib/data/masterKelas";
import { MasterKelasManager } from "./MasterKelasManager";

export const metadata: Metadata = { title: "Master Kelas — LMS Nggodimeda" };

export default async function MasterKelasPage() {
  const data = await getMasterKelasData();

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🗂️"
        title="Master Kelas"
        subtitle="Pembagian guru per mata pelajaran dan siswa per kelas"
      />
      <MasterKelasManager {...data} />
    </div>
  );
}
