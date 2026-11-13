import { useEffect, useEffectEvent, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Download,
  FileText,
  FolderInput,
  FolderPlus,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  documentCategories,
  documentExtensions,
  documentMaxMb,
} from '~/data/org-taxonomy';
import { labelOf } from '~/data/taxonomy';
import {
  downloadDocument,
  serverFieldErrors,
  useDeleteDocument,
  useDeleteFolder,
  useDocuments,
  useFolders,
  useMoveDocument,
  useReprocessDocument,
  useUpdateDocument,
  useUploadDocument,
} from '~/features/orgs';
import {
  documentUpdateFormResolver,
  documentUploadFormResolver,
  type DocumentUpdateForm,
  type DocumentUploadForm,
  type KnowledgeFolder,
  type OrgDocument,
} from '~/lib/schema';
import { useFileUpload } from '~/hooks/use-file-upload';
import { useOrg } from '~/lib/org/org-context';
import { formatDate } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Form } from '~/components/ui/form';
import { DropZone } from '~/components/ui/drop-zone';
import { Picker } from '~/components/ui/picker';
import {
  AppCard,
  AppDropdown,
  AppSheet,
  useConfirm,
} from '~/components/composed';
import {
  FormPickerField,
  FormTextareaField,
  FormTextField,
} from '~/components/form-fields';
import type { EditingProps } from './profile-tabs';
import { DocumentStatusBadge } from './document-status';
import { FolderGrid } from './folder-grid';
import { FolderSheet } from './folder-sheet';

const sizeLabel = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const titleFrom = (fileName: string) =>
  fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

/**
 * Documents live in folders (profiles, past proposals, CVs…). The tab lists the
 * folders; `?folder=<id>` opens one. A background job reads each upload so
 * agents can draw on it; the list shows its progress and polls until it
 * settles. `?edit=upload` uploads, `?edit=doc:<id>` edits a document,
 * `?edit=folder:new` / `?edit=folder:<id>` creates or edits a folder.
 */
export function DocumentsTab({ editing, setEditing }: Readonly<EditingProps>) {
  const { view } = useOrg();
  const [params, setParams] = useSearchParams();
  const { data: folders = [], isPending: foldersPending } = useFolders(view.id);
  const folder = folders.find((f) => f.id === params.get('folder'));
  const openFolder = (id: string | null) =>
    setParams(
      (next) => {
        if (id) next.set('folder', id);
        else next.delete('folder');
        return next;
      },
      { replace: true }
    );
  const canEdit = view.myRole === 'admin' && !view.isArchived;
  const folderEditing = editing?.startsWith('folder:')
    ? editing.slice(7)
    : undefined;

  return (
    <>
      {folder ? (
        <FolderDocuments
          folder={folder}
          folders={folders}
          canEdit={canEdit}
          editing={editing}
          setEditing={setEditing}
          onBack={() => openFolder(null)}
        />
      ) : (
        <AppCard
          title="Documents"
          description="Folders of profiles, reports and past proposals — context your agents can draw on."
          actions={
            canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing('folder:new')}
              >
                <FolderPlus className="h-3.5 w-3.5" /> New folder
              </Button>
            )
          }
        >
          {!foldersPending && (
            <FolderGrid folders={folders} onOpen={openFolder} />
          )}
        </AppCard>
      )}
      {/* The setup checklist links here with ?edit=upload: pick a folder in the sheet. */}
      {!folder && (
        <UploadSheet
          open={canEdit && editing === 'upload'}
          folderId=""
          folders={folders}
          onClose={() => setEditing(null)}
        />
      )}
      <FolderSheet
        open={canEdit && !!folderEditing}
        folder={folders.find((f) => f.id === folderEditing)}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function FolderDocuments({
  folder,
  folders,
  canEdit,
  editing,
  setEditing,
  onBack,
}: Readonly<
  EditingProps & {
    folder: KnowledgeFolder;
    folders: KnowledgeFolder[];
    canEdit: boolean;
    onBack: () => void;
  }
>) {
  const { view } = useOrg();
  // Filters are view state, not form data.
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { data: documents = [], isPending } = useDocuments(view.id, {
    folder: folder.id,
    ...(category ? { category } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  });
  const remove = useDeleteDocument(view.id);
  const removeFolder = useDeleteFolder(view.id);
  const move = useMoveDocument(view.id);
  const reprocess = useReprocessDocument(view.id);
  const { confirm, confirmDialog } = useConfirm();
  const editingId = editing?.startsWith('doc:') ? editing.slice(4) : undefined;
  const otherFolders = folders.filter((f) => f.id !== folder.id);

  const onMove = async (doc: OrgDocument, target: KnowledgeFolder) => {
    try {
      await move.mutateAsync({ id: doc.id, folderId: target.id });
      toastUtils.success(`Moved to ${target.name}`);
    } catch (error) {
      toastUtils.error('Could not move', extractError(error));
    }
  };

  const onDeleteFolder = async () => {
    const ok = await confirm({
      title: `Delete “${folder.name}”?`,
      description: 'Only empty folders can be deleted.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeFolder.mutateAsync(folder.id);
      onBack();
      toastUtils.success('Folder deleted');
    } catch (error) {
      toastUtils.error('Could not delete the folder', extractError(error));
    }
  };

  const onDownload = async (doc: OrgDocument) => {
    try {
      await downloadDocument(view.id, doc);
    } catch (error) {
      toastUtils.error('Could not download', extractError(error));
    }
  };

  const onRetry = async (doc: OrgDocument) => {
    try {
      await reprocess.mutateAsync(doc.id);
      toastUtils.success('Reading it again');
    } catch (error) {
      toastUtils.error('Could not retry', extractError(error));
    }
  };

  const onRemove = async (doc: OrgDocument) => {
    const ok = await confirm({
      title: `Delete “${doc.title}”?`,
      description: 'The file is removed for everyone in the organization.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(doc.id);
      toastUtils.success('Document deleted');
    } catch (error) {
      toastUtils.error('Could not delete', extractError(error));
    }
  };

  return (
    <>
      <Button variant="link" className="mb-2 px-0" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> All folders
      </Button>
      <AppCard
        title={folder.name}
        description={folder.purpose || undefined}
        actions={
          canEdit && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing('upload')}
              >
                <Plus className="h-3.5 w-3.5" /> Upload
              </Button>
              <AppDropdown
                label={`Folder actions for ${folder.name}`}
                items={[
                  {
                    label: 'Edit folder',
                    icon: Pencil,
                    onSelect: () => setEditing(`folder:${folder.id}`),
                  },
                  {
                    label: 'Delete folder',
                    icon: Trash2,
                    destructive: true,
                    onSelect: onDeleteFolder,
                  },
                ]}
              />
            </div>
          )
        }
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles and descriptions"
            aria-label="Search documents"
            className="sm:flex-1"
          />
          <Picker
            items={[...documentCategories]}
            value={category || null}
            onChange={(value) =>
              setCategory(typeof value === 'string' ? value : '')
            }
            placeholder="All categories"
            size="sm"
            className="sm:w-60"
          />
        </div>
        {isPending ? null : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {category || search
              ? 'No documents match.'
              : 'No documents in this folder yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <DocumentStatusBadge status={doc.processingStatus} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {labelOf(documentCategories, doc.category)} · {doc.fileName}{' '}
                    · {sizeLabel(doc.size)} · {formatDate(doc.createdAt)}
                  </p>
                  {doc.processingError && (
                    <p
                      className={cn(
                        'mt-1 text-xs',
                        doc.processingStatus === 'failed'
                          ? 'text-destructive'
                          : 'text-amber-700 dark:text-amber-400'
                      )}
                    >
                      {doc.processingError}
                    </p>
                  )}
                </div>
                {canEdit && doc.processingStatus === 'failed' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Retry reading ${doc.title}`}
                    title="Retry"
                    disabled={reprocess.isPending}
                    onClick={() => onRetry(doc)}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Download ${doc.title}`}
                  onClick={() => onDownload(doc)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canEdit && otherFolders.length > 0 && (
                  <AppDropdown
                    label={`Move ${doc.title}`}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${doc.title}`}
                        title="Move to another folder"
                        disabled={move.isPending}
                      >
                        <FolderInput className="h-4 w-4" />
                      </Button>
                    }
                    items={otherFolders.map((target) => ({
                      label: `Move to ${target.name}`,
                      onSelect: () => onMove(doc, target),
                    }))}
                  />
                )}
                {canEdit && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${doc.title}`}
                      onClick={() => setEditing(`doc:${doc.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${doc.title}`}
                      onClick={() => onRemove(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </AppCard>

      <UploadSheet
        open={canEdit && editing === 'upload'}
        folderId={folder.id}
        folders={folders}
        onClose={() => setEditing(null)}
      />
      <EditDocumentSheet
        doc={canEdit ? documents.find((d) => d.id === editingId) : undefined}
        onClose={() => setEditing(null)}
      />
      {confirmDialog}
    </>
  );
}

function UploadSheet({
  open,
  folderId,
  folders,
  onClose,
}: Readonly<{
  open: boolean;
  folderId: string;
  folders: KnowledgeFolder[];
  onClose: () => void;
}>) {
  const { view } = useOrg();
  const upload = useUploadDocument(view.id);
  const form = useForm<DocumentUploadForm>({
    resolver: documentUploadFormResolver,
    defaultValues: { title: '', description: '', category: 'other', folderId },
  });
  const {
    file,
    addFiles,
    clear,
    error: fileError,
  } = useFileUpload({
    accept: [...documentExtensions],
    maxSizeBytes: documentMaxMb * 1024 * 1024,
    onFileChange: (files) => {
      const picked = files[0]?.file;
      form.setValue('file', picked as File, { shouldValidate: !!picked });
      if (picked && !form.getValues('title'))
        form.setValue('title', titleFrom(picked.name));
    },
  });

  const onOpened = useEffectEvent(() => {
    form.reset({ title: '', description: '', category: 'other', folderId });
    clear();
  });
  useEffect(() => {
    if (open) onOpened();
  }, [open]);

  const submit = form.handleSubmit(async (data) => {
    try {
      await upload.mutateAsync(data);
      toastUtils.success('Document uploaded');
      onClose();
    } catch (error) {
      for (const [name, message] of Object.entries(serverFieldErrors(error))) {
        form.setError(name as keyof DocumentUploadForm, { message });
      }
      toastUtils.error('Could not upload', extractError(error));
    }
  });

  const fileMessage = fileError ?? form.formState.errors.file?.message;

  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      dismissible={false}
      title="Upload a document"
      description={`Up to ${documentMaxMb} MB. The AI reads PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), text and CSV files; other types are stored but not read yet.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="upload-form"
            disabled={upload.isPending || !file || folders.length === 0}
          >
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          method="post"
          id="upload-form"
          onSubmit={submit}
          className="space-y-4"
        >
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sizeLabel(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${file.name}`}
                onClick={clear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <DropZone
              onFiles={addFiles}
              accept={documentExtensions.join(',')}
              multiple={false}
              hint={`Max ${documentMaxMb} MB`}
            />
          )}
          {fileMessage && (
            <p className="text-sm text-destructive">{fileMessage}</p>
          )}
          {folders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create a folder first (Documents › New folder), then upload into
              it.
            </p>
          ) : (
            <FormPickerField
              control={form.control}
              name="folderId"
              label="Folder"
              placeholder="Which folder?"
              options={folders.map((f) => ({ value: f.id, label: f.name }))}
              clearable={false}
              required
            />
          )}
          <FormTextField
            control={form.control}
            name="title"
            autoComplete="off"
            placeholder="e.g. Annual report 2025"
            label="Title"
            required
          />
          <FormPickerField
            control={form.control}
            name="category"
            placeholder="What kind of document?"
            label="Category"
            options={documentCategories}
            clearable={false}
          />
          <FormTextareaField
            control={form.control}
            name="description"
            autoComplete="off"
            placeholder="What’s in it, and why it matters (optional)"
            label="Description"
            rows={3}
          />
        </form>
      </Form>
    </AppSheet>
  );
}

function EditDocumentSheet({
  doc,
  onClose,
}: Readonly<{ doc: OrgDocument | undefined; onClose: () => void }>) {
  const { view } = useOrg();
  const update = useUpdateDocument(view.id);
  const form = useForm<DocumentUpdateForm>({
    resolver: documentUpdateFormResolver,
  });

  const onOpened = useEffectEvent((current: OrgDocument) =>
    form.reset({
      title: current.title,
      description: current.description,
      category: current.category as DocumentUpdateForm['category'],
    })
  );
  useEffect(() => {
    if (doc) onOpened(doc);
  }, [doc]);

  const submit = form.handleSubmit(async (data) => {
    if (!doc) return;
    try {
      await update.mutateAsync({ id: doc.id, ...data });
      toastUtils.success('Document updated');
      onClose();
    } catch (error) {
      toastUtils.error('Could not save', extractError(error));
    }
  });

  return (
    <AppSheet
      open={!!doc}
      onOpenChange={(next) => !next && onClose()}
      dismissible={false}
      title="Edit document"
      description={doc?.fileName}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="document-form"
            disabled={update.isPending}
          >
            Save changes
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          method="post"
          id="document-form"
          onSubmit={submit}
          className="space-y-4"
        >
          <FormTextField
            control={form.control}
            name="title"
            autoComplete="off"
            placeholder="e.g. Annual report 2025"
            label="Title"
            required
          />
          <FormPickerField
            control={form.control}
            name="category"
            placeholder="What kind of document?"
            label="Category"
            options={documentCategories}
            clearable={false}
          />
          <FormTextareaField
            control={form.control}
            name="description"
            autoComplete="off"
            placeholder="What’s in it, and why it matters (optional)"
            label="Description"
            rows={3}
          />
        </form>
      </Form>
    </AppSheet>
  );
}
