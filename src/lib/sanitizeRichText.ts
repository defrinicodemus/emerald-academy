import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "h2", "strong", "em", "ul", "ol", "li", "br", "span"];
const INDENT_STYLE = { "margin-left": [/^\d+(?:\.\d+)?em$/] };

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      span: ["style"],
      p: ["style"],
      h2: ["style"],
    },
    allowedStyles: {
      span: {
        "font-size": [/^\d+(?:\.\d+)?px$/],
      },
      p: INDENT_STYLE,
      h2: INDENT_STYLE,
    },
    // TextStyle marks render as <span style="..."> — only keep them if they
    // actually carry an allowed style, otherwise drop the wrapper entirely.
    exclusiveFilter: (frame) => frame.tag === "span" && !frame.attribs.style,
  });
}
