// src/components/admin/RichContentEditor.tsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { useCallback, useRef, ReactNode, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
  label: string;
}

const ToolbarButton = ({
  onClick,
  isActive,
  children,
  label,
}: ToolbarButtonProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onClick}
          className="rounded-md mx-1"
          title={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface RichContentEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichContentEditor({
  content,
  onChange,
}: RichContentEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      // Allow color & highlight styles; Highlight will parse inline background colors on paste
      Highlight.configure({ multicolor: true }),
      TextStyle, // enables setMark('textStyle', { ...css })
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: content || "<p>Start writing...</p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addImageFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = typeof reader.result === "string" ? reader.result : "";
        if (src) {
          editor?.chain().focus().setImage({ src }).run();
        }
        // reset value so selecting the same file again still triggers onChange
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    },
    [editor]
  );

  const onPickImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      addImageFromFile(file);
    },
    [addImageFromFile]
  );

  const applyFontSize = (sizePx: string) => {
    editor?.chain().focus().setMark("textStyle", { fontSize: sizePx }).run();
  };

  const applyLineHeight = (lh: string) => {
    // line-height applied via TextStyle works on spans; good enough for editor feel
    editor?.chain().focus().setMark("textStyle", { lineHeight: lh }).run();
  };

  const applyWordSpacing = (ws: string) => {
    editor
      ?.chain()
      .focus()
      .setMark("textStyle", { wordSpacing: ws, letterSpacing: ws })
      .run();
  };

  if (!editor) return null;

  return (
    <div
      className="w-full border rounded-lg p-2 space-y-2 bg-background shadow-sm"
      onClick={() => editor.chain().focus().run()} // click anywhere → focus (feels like Textarea)
      role="group"
      aria-label="Rich text editor"
    >
      {/* hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b pb-2">
        {/* Font Family */}
        <Select
          onValueChange={(value) => {
            editor
              .chain()
              .focus()
              .setMark("textStyle", { fontFamily: value })
              .run();
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Font style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="serif">Serif</SelectItem>
            <SelectItem value="sans-serif">Sans</SelectItem>
            <SelectItem value="monospace">Mono</SelectItem>
            <SelectItem value="cursive">Cursive</SelectItem>
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select onValueChange={(value) => applyFontSize(value)}>
          <SelectTrigger className="w-[110px] h-8 text-sm">
            <SelectValue placeholder="Font size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12px">12</SelectItem>
            <SelectItem value="14px">14</SelectItem>
            <SelectItem value="16px">16</SelectItem>
            <SelectItem value="18px">18</SelectItem>
            <SelectItem value="20px">20</SelectItem>
            <SelectItem value="24px">24</SelectItem>
            <SelectItem value="28px">28</SelectItem>
            <SelectItem value="32px">32</SelectItem>
          </SelectContent>
        </Select>

        {/* Line Height */}
        <Select onValueChange={(value) => applyLineHeight(value)}>
          <SelectTrigger className="w-[120px] h-8 text-sm">
            <SelectValue placeholder="Line height" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1.0</SelectItem>
            <SelectItem value="1.2">1.2</SelectItem>
            <SelectItem value="1.4">1.4</SelectItem>
            <SelectItem value="1.6">1.6</SelectItem>
            <SelectItem value="1.8">1.8</SelectItem>
            <SelectItem value="2">2.0</SelectItem>
          </SelectContent>
        </Select>

        {/* Word Spacing (also maps to letterSpacing lightly) */}
        <Select onValueChange={(value) => applyWordSpacing(value)}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Word spacing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0em">Default</SelectItem>
            <SelectItem value="0.03em">+ Slight</SelectItem>
            <SelectItem value="0.06em">++ Medium</SelectItem>
            <SelectItem value="0.1em">+++ Wide</SelectItem>
          </SelectContent>
        </Select>

        {/* Text styles */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          label="Bold"
        >
          B
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          label="Italic"
        >
          I
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          label="Underline"
        >
          U
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          label="Strike"
        >
          S
        </ToolbarButton>

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          label="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          label="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          label="Heading 3"
        >
          H3
        </ToolbarButton>

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          label="Bullet List"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          label="Ordered List"
        >
          1.
        </ToolbarButton>

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          label="Align Left"
        >
          ⬅
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          label="Align Center"
        >
          ⬍
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          label="Align Right"
        >
          ➡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          label="Justify"
        >
          ☰
        </ToolbarButton>

        {/* Colors */}
        <Input
          type="color"
          className="w-10 h-8 p-0 border-none"
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
          title="Text color"
        />
        <Input
          type="color"
          className="w-10 h-8 p-0 border-none"
          onChange={(e) =>
            editor.chain().focus().setHighlight({ color: e.target.value }).run()
          }
          title="Highlight"
        />

        {/* Remove highlight */}
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetHighlight().run()}
          label="Remove Highlight"
        >
          ⌫HL
        </ToolbarButton>

        {/* Clear all formatting (marks) on selection */}
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          label="Clear Formatting"
        >
          ⌫Fmt
        </ToolbarButton>

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt("Enter URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          isActive={editor.isActive("link")}
          label="Insert Link"
        >
          🔗
        </ToolbarButton>

        {/* Image: upload from file (not link) */}
        <ToolbarButton onClick={onPickImage} label="Upload Image">
          🖼
        </ToolbarButton>

        {/* Columns / Sections */}
        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent(
                '<div class="grid grid-cols-2 gap-4"><div><p>Column 1</p></div><div><p>Column 2</p></div></div>'
              )
              .run()
          }
          label="Insert Columns"
        >
          ⧉
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent(
                '<section class="p-4 border rounded-md"><p>New Section</p></section>'
              )
              .run()
          }
          label="Insert Section"
        >
          ▭
        </ToolbarButton>

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          label="Undo"
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          label="Redo"
        >
          ↷
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[200px] p-2 focus:outline-none cursor-text"
      />
    </div>
  );
}
