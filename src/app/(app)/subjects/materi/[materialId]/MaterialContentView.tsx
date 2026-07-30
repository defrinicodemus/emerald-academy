import type { MaterialContentRow } from "@/lib/data/subjects";

export function MaterialContentView({ material: m }: { material: MaterialContentRow }) {
  if (m.kind === "text") {
    return m.content ? (
      <div
        className="rich-text-content rounded-3xl border-0 bg-card p-6 text-sm shadow-soft"
        dangerouslySetInnerHTML={{ __html: m.content }}
      />
    ) : (
      <p className="rounded-3xl border-0 bg-card p-6 text-sm shadow-soft">Belum ada isi materi.</p>
    );
  }
  if (m.kind === "image" && m.url) {
    return (
      <div className="rounded-3xl border-0 bg-card p-6 shadow-soft">
        <img src={m.url} alt={m.title} className="w-full rounded-xl object-cover" />
      </div>
    );
  }
  if (m.kind === "video" && m.url) {
    return (
      <div className="overflow-hidden rounded-3xl border-0 bg-card p-6 shadow-soft">
        <div className="aspect-video w-full overflow-hidden rounded-xl">
          <iframe src={m.url} title={m.title} className="h-full w-full" allowFullScreen />
        </div>
      </div>
    );
  }
  if (m.kind === "slideshow" && m.url) {
    return (
      <div className="overflow-hidden rounded-3xl border-0 bg-card p-6 shadow-soft">
        <div className="aspect-video w-full overflow-hidden rounded-xl">
          <iframe src={m.url} title={m.title} className="h-full w-full" allowFullScreen />
        </div>
      </div>
    );
  }
  if (m.kind === "pdf" && m.url) {
    return (
      <div className="overflow-hidden rounded-3xl border-0 bg-card p-6 shadow-soft">
        <div className="overflow-hidden rounded-xl border">
          <iframe src={m.url} title={m.title} className="h-[75vh] w-full" />
        </div>
      </div>
    );
  }
  return (
    <p className="rounded-3xl border-0 bg-card p-6 text-sm text-muted-foreground shadow-soft">
      Konten belum tersedia.
    </p>
  );
}
