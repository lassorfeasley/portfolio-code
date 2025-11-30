'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
};

const minimalContent = '<p></p>';

export function RichTextEditor({ value, onChange, placeholder, label, description }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Start typing…',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: value || minimalContent,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || minimalContent) !== current) {
      editor.commands.setContent(value || minimalContent, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="space-y-2">
        {label ? <p className="text-sm font-medium text-muted-foreground">{label}</p> : null}
        <div className="h-40 rounded-lg border bg-muted/30" />
      </div>
    );
  }

  const applyLink = () => {
    const prevUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', prevUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const toolbarButton = (opts: { onClick: () => void; isActive?: boolean; icon: React.ReactNode; label: string }) => (
    <Button
      type="button"
      size="sm"
      variant={opts.isActive ? 'default' : 'outline'}
      className="h-8 w-8 p-0"
      onClick={opts.onClick}
      title={opts.label}
    >
      {opts.icon}
    </Button>
  );

  return (
    <div className="space-y-2">
      {label ? (
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-2">
        {toolbarButton({
          onClick: () => editor.chain().focus().toggleBold().run(),
          isActive: editor.isActive('bold'),
          icon: <Bold className="h-4 w-4" />,
          label: 'Bold',
        })}
        {toolbarButton({
          onClick: () => editor.chain().focus().toggleItalic().run(),
          isActive: editor.isActive('italic'),
          icon: <Italic className="h-4 w-4" />,
          label: 'Italic',
        })}
        {toolbarButton({
          onClick: () => editor.chain().focus().toggleBulletList().run(),
          isActive: editor.isActive('bulletList'),
          icon: <List className="h-4 w-4" />,
          label: 'Bullet list',
        })}
        {toolbarButton({
          onClick: () => editor.chain().focus().toggleOrderedList().run(),
          isActive: editor.isActive('orderedList'),
          icon: <ListOrdered className="h-4 w-4" />,
          label: 'Ordered list',
        })}
        {toolbarButton({
          onClick: applyLink,
          isActive: editor.isActive('link'),
          icon: <LinkIcon className="h-4 w-4" />,
          label: 'Add link',
        })}
      </div>
      <div className="rounded-lg border bg-background">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}


