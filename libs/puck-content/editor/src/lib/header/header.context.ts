import { Data } from '@puckeditor/core';
import { EditorHeaderMenuAction, PublishCheck } from '@wepublish/ui/editor';
import { createContext, useContext } from 'react';

export type PuckDocumentStatus = 'draft' | 'pending' | 'published' | 'none';

export type PuckPublishDialogConfig = {
  title: string;
  url?: string;
  publishedAt?: Date;
  dateLabel: string;
  dateHelperText?: string;
  pendingMessage?: (publishedAt: Date) => string;
  checks: PublishCheck[];
  options?: string[];
};

export type PuckDocumentAutosave = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export type PuckDocumentController = {
  backTo: string;
  backLabel: string;
  status: PuckDocumentStatus;
  statusLabel: string;
  lastSavedAt?: Date;
  isNew: boolean;
  busy?: boolean;
  hasUnpublishedChanges: boolean;
  canSave: boolean;
  canPublish: boolean;
  previewUrl?: string;
  publishDialog?: PuckPublishDialogConfig;
  autosave?: PuckDocumentAutosave;
  menuActions?: EditorHeaderMenuAction[];
  onSave(data: Data): Promise<void>;
  onPublish?(data: Data, publishedAt: Date): Promise<void>;
};

export const PuckDocumentControllerContext =
  createContext<PuckDocumentController | null>(null);

export const usePuckDocumentController = () =>
  useContext(PuckDocumentControllerContext);
