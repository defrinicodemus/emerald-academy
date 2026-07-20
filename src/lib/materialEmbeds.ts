export function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

export function extractGoogleSlidesId(url: string): string | null {
  const match = url.match(/presentation\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
