import { PuckPublishDialogConfig } from '@wepublish/puck-content/editor';
import { createContext } from 'react';

export type PuckPublishDialogOf = (
  rootProps: object
) => PuckPublishDialogConfig;

export type PuckDocumentEditorEvents = {
  publishDialogOf?: PuckPublishDialogOf;
  onPluginChange?: (plugin: string | null) => void;
};

export const PuckDocumentEditorEventsContext =
  createContext<PuckDocumentEditorEvents>({});
