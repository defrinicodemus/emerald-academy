import { Extension } from "@tiptap/core";

export interface IndentOptions {
  types: string[];
  indentStep: number;
  maxIndent: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indentBlock: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      indentStep: 1.5,
      maxIndent: 6,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const margin = element.style.marginLeft;
              if (!margin) return 0;
              const level = Math.round(parseFloat(margin) / this.options.indentStep);
              return Number.isFinite(level) && level > 0 ? level : 0;
            },
            renderHTML: (attributes) => {
              const level = (attributes.indent as number) ?? 0;
              if (!level) return {};
              return { style: `margin-left: ${level * this.options.indentStep}em` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indentBlock:
        () =>
        ({ state, commands }) => {
          const { $from } = state.selection;
          const node = $from.node();
          const type = node.type.name;
          if (!this.options.types.includes(type)) return false;

          const current = (node.attrs.indent as number) ?? 0;
          if (current >= this.options.maxIndent) return false;

          return commands.updateAttributes(type, { indent: current + 1 });
        },
    };
  },
});
