import { Folder } from 'lucide-react';
import type { KnowledgeFolder } from '~/lib/schema';

/** The organization's folders as cards; clicking one opens it. */
export function FolderGrid({
  folders,
  onOpen,
}: Readonly<{ folders: KnowledgeFolder[]; onOpen: (id: string) => void }>) {
  if (folders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No folders yet. Create one, then upload documents into it.
      </p>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {folders.map((folder) => (
        <li key={folder.id}>
          <button
            type="button"
            onClick={() => onOpen(folder.id)}
            className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
          >
            <Folder className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {folder.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {folder.documentCount} document
                {folder.documentCount === 1 ? '' : 's'}
                {folder.purpose && ` · ${folder.purpose}`}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
