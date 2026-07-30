import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BackButton({ href }: { href: string }) {
  return (
    <Button asChild variant="outline" className="rounded-xl">
      <Link href={href}>← Kembali</Link>
    </Button>
  );
}
