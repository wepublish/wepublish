'use client';

import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { TeaserSlotsAutofillConfigInput } from '@wepublish/editor/api';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TeaserSlotsAutofillConfigPanel } from './teaser-slots-autofill-config';

interface TeaserSlotsDialogProps {
  config: TeaserSlotsAutofillConfigInput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: TeaserSlotsAutofillConfigInput) => void;
  onCancel: () => void;
}

const Description = styled('p')`
  color: var(--mui-palette-text-secondary);
  margin-top: 8px;
  margin-bottom: 16px;
`;

const ContentContainer = styled.div`
  padding: 16px 0;
`;

const FooterContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export function TeaserSlotsAutofillDialog({
  config,
  open,
  onOpenChange,
  onSave,
  onCancel,
  children,
}: PropsWithChildren<TeaserSlotsDialogProps>) {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] =
    useState<TeaserSlotsAutofillConfigInput>({ ...config });

  useEffect(() => {
    if (open) {
      setLocalConfig({ ...config });
    }
  }, [open, config]);

  const handleSave = () => {
    onSave({ ...localConfig });
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleClose = () => {
    handleCancel();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {!localConfig.enabled ?
          t('blocks.teaserSlots.dialogTitleEnable')
        : t('blocks.teaserSlots.dialogTitleConfigure')}

        <Description>
          {!localConfig.enabled ?
            t('blocks.teaserSlots.dialogDescriptionEnable')
          : t('blocks.teaserSlots.dialogDescriptionConfigure')}
        </Description>
      </DialogTitle>

      <DialogContent>
        <ContentContainer>
          <TeaserSlotsAutofillConfigPanel
            config={localConfig}
            onChange={setLocalConfig}
          />
        </ContentContainer>
      </DialogContent>

      <DialogActions>
        <FooterContainer>
          <Button
            variant="text"
            onClick={handleCancel}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
          >
            {!localConfig.enabled ?
              t('blocks.teaserSlots.enableAndSave')
            : t('blocks.teaserSlots.saveConfiguration')}
          </Button>
        </FooterContainer>
      </DialogActions>
    </Dialog>
  );
}
