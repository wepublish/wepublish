import { createUsePuck } from '@puckeditor/core';
import {
  PuckDocumentControllerContext,
  usePuckDocumentController,
} from '@wepublish/puck-content/editor';
import { ReactNode, useContext, useEffect, useMemo } from 'react';

import { PuckDocumentEditorEventsContext } from './puck-document-controller.context';

const usePuck = createUsePuck();

export function PuckDocumentControllerBridge({
  children,
}: {
  children: ReactNode;
}) {
  const controller = usePuckDocumentController();
  const { publishDialogOf, onPluginChange } = useContext(
    PuckDocumentEditorEventsContext
  );
  const rootProps = usePuck(puck => puck.appState.data.root.props);
  const plugin = usePuck(puck => puck.appState.ui.plugin?.current ?? null);

  useEffect(() => {
    onPluginChange?.(plugin);
  }, [onPluginChange, plugin]);

  const value = useMemo(
    () =>
      controller && publishDialogOf ?
        { ...controller, publishDialog: publishDialogOf(rootProps ?? {}) }
      : controller,
    [controller, publishDialogOf, rootProps]
  );

  return (
    <PuckDocumentControllerContext.Provider value={value}>
      {children}
    </PuckDocumentControllerContext.Provider>
  );
}
