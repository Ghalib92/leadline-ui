import { useRef } from 'react';
import { Download, FileText, RotateCw, Trash2, Upload } from 'lucide-react';
import { documentMaxMb } from '~/data/org-taxonomy';
import {
  downloadDocument,
  useDeleteDocument,
  useDocuments,
  useFolders,
  useReprocessDocument,
  useUploadDocument,
} from '~/features/orgs';
import type { OrgDocument } from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { formatDate } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { DropZone } from '~/components/ui/drop-zone';
import { AppCard, useConfirm } from '~/components/composed';
import { DocumentStatusBadge } from './document-status';

/** CVs the AI can read. */
export const CV_ACCEPT = '.pdf,.docx,.txt';

const asFile = (files: FileList | File[] | File) =>
  files instanceof File ? files : Array.from(files)[0];

/**
 * A job seeker's CV, and nothing else: no folders, no company categories.
 * Required: searches start once Leadline has read it. Uploading a new one
 * replaces the old.
 */
export function CvTab() {
  const { view } = useOrg();
  const canEdit = view.myRole === 'admin' && !view.isArchived;
  const { data: documents = [], isPending } = useDocuments(view.id);
  const { data: folders = [] } = useFolders(view.id);
  const upload = useUploadDocument(view.id);
  const remove = useDeleteDocument(view.id);
  const retry = useReprocessDocument(view.id);
  const { confirm, confirmDialog } = useConfirm();
  const replaceInput = useRef<HTMLInputElement>(null);

  const cv = documents[0];
  const busy = upload.isPending || remove.isPending;

  const send = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > documentMaxMb * 1024 * 1024) {
      toastUtils.error('File too large', `Keep it under ${documentMaxMb} MB.`);
      return;
    }
    const folderId = folders[0]?.id;
    if (!folderId) {
      toastUtils.error(
        'Could not upload',
        'Please reload the page and try again.'
      );
      return;
    }
    try {
      await upload.mutateAsync({
        title: 'CV',
        description: '',
        category: 'cv',
        folderId,
        file,
      });
      // One CV at a time: the new one replaces the rest.
      await Promise.all(documents.map((doc) => remove.mutateAsync(doc.id)));
      toastUtils.success(
        'CV uploaded',
        'Leadline is reading it. This takes about a minute.'
      );
    } catch (error) {
      toastUtils.error('Could not upload your CV', extractError(error));
    }
  };

  const onDelete = async (doc: OrgDocument) => {
    const ok = await confirm({
      title: 'Delete your CV?',
      description: 'Searches stop until you upload a new one.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(doc.id);
      toastUtils.success('CV deleted');
    } catch (error) {
      toastUtils.error('Could not delete', extractError(error));
    }
  };

  return (
    <AppCard
      title={
        <>
          Your CV{' '}
          <span className="text-destructive" aria-label="required">
            *
          </span>
        </>
      }
      description="Every job is scored against your CV, and your cover letters are written from it. Searches start once Leadline has read it."
      actions={
        cv &&
        canEdit && (
          <>
            <input
              ref={replaceInput}
              type="file"
              accept={CV_ACCEPT}
              className="hidden"
              aria-label="Choose a new CV"
              onChange={(event) => {
                void send(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => replaceInput.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" /> Upload a new CV
            </Button>
          </>
        )
      }
    >
      {isPending ? null : !cv ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Leadline can’t look for jobs until your CV is here.
          </p>
          {canEdit && (
            <DropZone
              onFiles={(files) => void send(asFile(files))}
              accept={CV_ACCEPT}
              multiple={false}
              disabled={busy}
              hint={`PDF or Word (.docx), up to ${documentMaxMb} MB`}
            >
              {busy ? 'Uploading…' : undefined}
            </DropZone>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{cv.fileName}</p>
              <p className="text-xs text-muted-foreground">
                Uploaded {formatDate(cv.createdAt)}
              </p>
            </div>
            <DocumentStatusBadge status={cv.processingStatus} />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Download your CV"
              onClick={() => downloadDocument(view.id, cv)}
            >
              <Download className="h-4 w-4" />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete your CV"
                disabled={busy}
                onClick={() => onDelete(cv)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {(cv.processingStatus === 'pending' ||
            cv.processingStatus === 'processing') && (
            <p className="text-sm text-muted-foreground">
              Leadline is reading your CV. Your skills and the jobs you can do
              appear under Profile when it’s done.
            </p>
          )}
          {(cv.processingStatus === 'failed' ||
            cv.processingStatus === 'unsupported') && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-destructive">
              <span>
                Leadline couldn’t read this file. Try again, or upload it as a
                PDF or Word (.docx) file.
              </span>
              {canEdit && cv.processingStatus === 'failed' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retry.isPending}
                  onClick={() =>
                    retry.mutate(cv.id, {
                      onError: (error) =>
                        toastUtils.error(
                          'Could not retry',
                          extractError(error)
                        ),
                    })
                  }
                >
                  <RotateCw className="h-3.5 w-3.5" /> Try again
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {confirmDialog}
    </AppCard>
  );
}
