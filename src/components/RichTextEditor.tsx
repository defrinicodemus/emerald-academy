"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-text-style/font-size";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Heading2, List, ListOrdered, ListIndentIncrease } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Indent } from "@/lib/tiptapIndentExtension";

const FONT_SIZES = [
  { label: "Normal", value: "normal" },
  { label: "Besar", value: "20px" },
  { label: "Sangat Besar", value: "28px" },
];

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Tulis materi pelajaran Anda di sini...",
  onChange,
  variant = "full",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  variant?: "full" | "simple";
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions:
      variant === "simple"
        ? [
            StarterKit.configure({ heading: false, bold: false, italic: false }),
            TextStyle,
            FontSize,
            Placeholder.configure({ placeholder }),
          ]
        : [
            StarterKit.configure({ heading: { levels: [2] } }),
            TextStyle,
            FontSize,
            Indent,
            Placeholder.configure({ placeholder }),
          ],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const nextHtml = editor.getHTML();
      setHtml(nextHtml);
      onChange?.(nextHtml);
    },
    editorProps: {
      attributes: {
        class:
          "rich-text-content min-h-[180px] rounded-b-2xl border border-t-0 bg-background px-4 py-3 text-sm focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const currentFontSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "normal";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-2xl border border-b-0 bg-muted/30 p-2">
        {variant === "full" && (
          <>
            <ToolbarButton
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              label="Tebal"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              label="Miring"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              label="Sub Judul"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}
        <Select
          value={currentFontSize}
          onValueChange={(v) => {
            if (v === "normal") editor.chain().focus().unsetFontSize().run();
            else editor.chain().focus().setFontSize(v).run();
          }}
        >
          <SelectTrigger className="h-8 w-[132px] rounded-lg text-xs">
            <SelectValue placeholder="Ukuran Huruf" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Daftar Bullet"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Daftar Bernomor"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        {variant === "full" && (
          <ToolbarButton
            active={false}
            onClick={() => {
              if (editor.isActive("listItem")) {
                editor.chain().focus().sinkListItem("listItem").run();
              } else {
                editor.chain().focus().indentBlock().run();
              }
            }}
            label="Menjorok"
          >
            <ListIndentIncrease className="h-4 w-4" />
          </ToolbarButton>
        )}
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted",
        active && "bg-primary-soft text-primary",
      )}
    >
      {children}
    </button>
  );
}
