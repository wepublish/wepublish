import styled from '@emotion/styled';
import { IconButton } from '@mui/material';
import {
  type FormValues,
  type ItemLayoutProps,
  editorForm,
} from '@wepublish/form/editor';
import { IconButtonTooltip } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdQrCode } from 'react-icons/md';

import { BypassQrDialog } from './bypassQrDialog';
import { paywallSchema } from './paywall.schema';

const TokenRow = editorForm.fieldsFor(paywallSchema, 'bypassTokens.*');

const Line = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export function BypassTokenRow({ index }: ItemLayoutProps) {
  const { t } = useTranslation();
  const token = useWatch<
    FormValues<typeof paywallSchema>,
    `bypassTokens.${number}.token`
  >({ name: `bypassTokens.${index}.token` });
  const [open, setOpen] = useState(false);
  const trimmed = (token ?? '').trim();

  return (
    <Line>
      <TokenRow.Field name="token" />
      <IconButtonTooltip caption={t('paywall.form.showQrCode')}>
        <span>
          <IconButton
            size="small"
            aria-label={t('paywall.form.showQrCode')}
            disabled={trimmed === ''}
            onClick={() => setOpen(true)}
          >
            <MdQrCode />
          </IconButton>
        </span>
      </IconButtonTooltip>
      <BypassQrDialog
        token={trimmed}
        open={open}
        onClose={() => setOpen(false)}
      />
    </Line>
  );
}
