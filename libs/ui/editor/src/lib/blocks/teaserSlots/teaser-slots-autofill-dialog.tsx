'use client';

import styled from '@emotion/styled';
import { TeaserSlotsAutofillConfigInput } from '@wepublish/editor/api-v2';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from 'rsuite';

import { TeaserSlotsAutofillConfigPanel } from './teaser-slots-autofill-config';

interface TeaserSlotsDialogProps {
  config: TeaserSlotsAutofillConfigInput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: TeaserSlotsAutofillConfigInput) => void;
  onCancel: () => void;
}

const StyledModal = styled(Modal)`
  .rs-modal-content {
    border-radius: 8px;
  }
`;

const Description = styled('p')`
  color: #6b7280;
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
    <StyledModal
      open={open}
      onClose={handleClose}
      size="sm"
    >
      <Modal.Header>
        <Modal.Title>
          {localConfig.enabled ?
            'Enable & Configure Auto-loading'
          : 'Configure Auto-loading'}
        </Modal.Title>
        <Description>
          {!localConfig.enabled ?
            'Enable and configure how teasers are automatically loaded into the grid.'
          : 'Configure how teasers are loaded and displayed in the grid.'}
        </Description>
      </Modal.Header>

      <Modal.Body>
        <ContentContainer>
          <TeaserSlotsAutofillConfigPanel
            config={localConfig}
            onChange={setLocalConfig}
          />
        </ContentContainer>
      </Modal.Body>

      <Modal.Footer>
        <FooterContainer>
          <Button
            appearance="subtle"
            onClick={handleCancel}
          >
            {t('cancel')}
          </Button>

          <Button
            appearance="primary"
            onClick={handleSave}
          >
            {!localConfig.enabled ? 'Enable & Save' : 'Save Configuration'}
          </Button>
        </FooterContainer>
      </Modal.Footer>
    </StyledModal>
  );
}
