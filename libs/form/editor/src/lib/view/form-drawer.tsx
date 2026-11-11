import { Drawer, IconButton } from '@mui/material';
import { useFormStatus, type AnyFormSchema } from '@wepublish/form/core';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerForm,
  DrawerTitle,
  IconButtonTooltip,
  type DrawerWidth,
} from '@wepublish/ui/editor';
import { useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';

import { DiscardChangesDialog } from './discard-changes-dialog';
import { FormTitle, ReadOnlyChip } from './form-page';
import { FormBody, FormRoot } from './form-root';
import { FormSaveActions } from './form-save-actions';
import { FormDrawerContext, useFormViewContext } from './form-view-context';
import { PanelBody, PanelHeader } from './form-view-layout';
import type { FormController } from './use-form-controller';

export type FormDrawerProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly width?: DrawerWidth;
  readonly children: ReactNode;
};

export function FormDrawer({
  open,
  onClose,
  width = 'md',
  children,
}: FormDrawerProps) {
  const titleId = useId();
  const [dirty, setDirty] = useState(false);
  const [asking, setAsking] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const requestClose = () => {
    if (dirty) {
      setAsking(true);

      return;
    }

    onClose();
  };

  return (
    <FormDrawerContext.Provider
      value={{ titleId, leaving, requestClose, setDirty }}
    >
      <Drawer
        anchor="right"
        open={open}
        onClose={requestClose}
        slotProps={{
          paper: {
            'aria-labelledby': titleId,
            sx: {
              width: DRAWER_WIDTHS[width],
              maxWidth: '100vw',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {children}
      </Drawer>
      <DiscardChangesDialog
        open={asking}
        onKeep={() => setAsking(false)}
        onDiscard={() => {
          flushSync(() => {
            setAsking(false);
            setLeaving(true);
            setDirty(false);
          });
          onClose();
          setLeaving(false);
        }}
      />
    </FormDrawerContext.Provider>
  );
}

function DirtyReporter() {
  const drawer = useContext(FormDrawerContext);
  const { isDirty } = useFormStatus();
  const setDirty = drawer === null ? undefined : drawer.setDirty;

  useEffect(() => {
    if (setDirty === undefined) {
      return;
    }

    setDirty(isDirty);

    return () => setDirty(false);
  }, [setDirty, isDirty]);

  return null;
}

function DrawerPanelHeader() {
  const { controller } = useFormViewContext();
  const drawer = useContext(FormDrawerContext);
  const { t } = useTranslation();

  return (
    <PanelHeader>
      <FormTitle
        render={text => (
          <DrawerTitle
            id={drawer === null ? undefined : drawer.titleId}
            noWrap
            title={text}
          >
            {text}
          </DrawerTitle>
        )}
      />
      <DrawerActions>
        {controller.headerActions}
        {controller.readOnly ?
          <ReadOnlyChip />
        : <FormSaveActions />}
        {drawer === null ? null : (
          <IconButtonTooltip caption={t('close')}>
            <IconButton
              size="small"
              aria-label={t('close')}
              onClick={drawer.requestClose}
            >
              <MdClose />
            </IconButton>
          </IconButtonTooltip>
        )}
      </DrawerActions>
    </PanelHeader>
  );
}

export function FormDrawerPanel<S extends AnyFormSchema>({
  controller,
}: {
  readonly controller: FormController<S>;
}) {
  return (
    <FormRoot
      controller={controller}
      as={DrawerForm}
      headingLevel="h3"
    >
      <DirtyReporter />
      <DrawerPanelHeader />
      <PanelBody>
        <FormBody />
      </PanelBody>
    </FormRoot>
  );
}
