import styled from '@emotion/styled';
import { Alert, Button, Typography } from '@mui/material';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { MdContentCopy } from 'react-icons/md';

const Result = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Secret = styled.code`
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1.5, 2)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.vars.palette.background.default};
  font-family: monospace;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  word-break: break-all;
`;

export type GeneratedTokenProps = {
  readonly token: string;
  readonly created: string;
  readonly copy: string;
  readonly copied: string;
  readonly warning: string;
};

export function GeneratedToken({
  token,
  created,
  copy,
  copied,
  warning,
}: GeneratedTokenProps) {
  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    enqueueSnackbar(copied, { variant: 'success', autoHideDuration: 3000 });
  };

  return (
    <Result>
      <Typography>{created}</Typography>
      <Secret data-sentry-mask>{token}</Secret>
      <Button
        variant="outlined"
        startIcon={<MdContentCopy />}
        onClick={copyToken}
      >
        {copy}
      </Button>
      <Alert
        severity="warning"
        sx={{ alignSelf: 'stretch' }}
      >
        {warning}
      </Alert>
    </Result>
  );
}
