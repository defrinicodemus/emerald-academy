export function richTextIsEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}
