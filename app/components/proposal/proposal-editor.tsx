import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  BookmarkPlus,
  BookOpen,
  Info,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import type { ProposalSection } from '~/lib/schema';

export function normalizeProposalMarkdown(md: string): string {
  return md
    .replace(/\\\[(TODO[^\]]*?)\\\]/g, '[$1]')
    .replace(/\\\[(\d+(?:\s*,\s*\d+)*)\\\]/g, '[$1]');
}

export interface ProposalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  evidence?: ProposalSection['evidence'];
  purpose?: string;
  disabled?: boolean;
}

export function ProposalEditor({
  value,
  onChange,
  placeholder = 'Draft your proposal section in natural, compelling language...',
  evidence = [],
  purpose,
  disabled = false,
}: Readonly<ProposalEditorProps>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        horizontalRule: {},
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'tiptap ProseMirror min-h-[300px] w-full px-4 py-3 text-sm focus:outline-none focus:ring-0 leading-relaxed text-foreground select-text',
      },
    },
    onUpdate: ({ editor }) => {
      // Extract markdown from TipTap storage
      const rawMarkdown =
        (
          editor.storage as { markdown?: { getMarkdown: () => string } }
        ).markdown?.getMarkdown() ?? '';
      const normalized = normalizeProposalMarkdown(rawMarkdown);
      onChange(normalized);
    },
  });

  // Sync external changes when not focused
  useEffect(() => {
    if (editor && !editor.isFocused && !editor.isDestroyed) {
      const current = normalizeProposalMarkdown(
        (
          editor.storage as { markdown?: { getMarkdown: () => string } }
        ).markdown?.getMarkdown() ?? ''
      );
      if (value !== current) {
        editor.commands.setContent(value);
      }
    }
  }, [editor, value]);

  if (!mounted || !editor) {
    return (
      <div className="min-h-[300px] rounded-md border border-input bg-background/50 p-4 text-sm text-muted-foreground">
        <p className="animate-pulse">Loading proposal editor...</p>
      </div>
    );
  }

  const text = editor.getText();
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const insertTodo = () => {
    editor.chain().focus().insertContent(' [TODO: specify detail here] ').run();
  };

  const insertCitation = (n: number) => {
    editor.chain().focus().insertContent(` [${n}] `).run();
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-xs transition-colors focus-within:border-primary/50">
      {/* Purpose prompt */}
      {purpose && (
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3.5 py-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-medium text-foreground">Section Goal:</span>
          <span className="line-clamp-1">{purpose}</span>
        </div>
      )}

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border bg-muted/20 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Heading 2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={cn(
              'h-7 w-7 text-xs font-semibold',
              editor.isActive('heading', { level: 2 }) &&
                'bg-primary/15 text-primary hover:bg-primary/20'
            )}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Heading 3"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={cn(
              'h-7 w-7 text-xs font-semibold',
              editor.isActive('heading', { level: 3 }) &&
                'bg-primary/15 text-primary hover:bg-primary/20'
            )}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Inline styles */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Bold (Ctrl+B)"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'h-7 w-7',
              editor.isActive('bold') &&
                'bg-primary/15 text-primary hover:bg-primary/20'
            )}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Italic (Ctrl+I)"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'h-7 w-7',
              editor.isActive('italic') &&
                'bg-primary/15 text-primary hover:bg-primary/20'
            )}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Highlight Text"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn(
              'h-7 w-7',
              editor.isActive('highlight') &&
                'bg-amber-200/80 text-amber-950 dark:bg-amber-500/40 dark:text-amber-100'
            )}
          >
            <Highlighter className="h-3.5 w-3.5" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Lists */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Bulleted List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'h-7 w-7',
              editor.isActive('bulletList') &&
                'bg-primary/15 text-primary hover:bg-primary/20'
            )}
          >
            <List className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Numbered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'h-7 w-7',
              editor.isActive('orderedList') &&
                'bg-primary/15 text-primary hover:bg-primary/20'
            )}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'h-7 w-7',
              editor.isActive('blockquote') &&
                'bg-primary/15 text-primary hover:bg-primary/20'
            )}
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Horizontal Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-7 w-7"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Undo/Redo */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Undo (Ctrl+Z)"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            className="h-7 w-7 disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Redo (Ctrl+Y)"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            className="h-7 w-7 disabled:opacity-40"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Human Assistance Quick Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={insertTodo}
            title="Insert a highlighted placeholder for your team to fill in"
            className="border-amber-500/40 bg-amber-500/5 text-amber-800 hover:bg-amber-500/15 hover:text-amber-900 dark:text-amber-300"
          >
            <BookmarkPlus className="h-3 w-3" />
            <span>Add [TODO]</span>
          </Button>

          {evidence.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Cite:</span>
              {evidence.slice(0, 4).map((e) => (
                <button
                  key={e.n}
                  type="button"
                  onClick={() => insertCitation(e.n)}
                  title={`Insert citation [${e.n}] from "${e.documentTitle}"`}
                  className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary hover:border-primary/50 hover:bg-primary/5"
                >
                  [{e.n}]
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="cursor-text bg-background">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{charCount} characters</span>
          <span>·</span>
          <span>~{readTimeMinutes} min read</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <BookOpen className="h-3 w-3 text-muted-foreground/70" />
          <span>Natural WYSIWYG editing · Markdown synced</span>
        </div>
      </div>
    </div>
  );
}
