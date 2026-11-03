import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import QRCodeStyling from 'qr-code-styling';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import markUrl from '../../ui/wepublish-mark.png';

const QrContent = styled(DialogContent)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-items: center;
`;

const BaseUrl = styled(TextField)`
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  height: auto;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
  padding: ${({ theme }) => theme.spacing(2)};
  background: #ffffff;

  & > div {
    max-width: 100%;
    height: auto;
  }
`;

const TokenUrl = styled.p`
  margin: 0;
  font-family: monospace;
  word-break: break-all;
  text-align: center;
`;

type BypassQrCodeProps = {
  token: string;
  baseUrl: string;
  onBaseUrlChange: (baseUrl: string) => void;
  onClose: () => void;
};

function BypassQrCode({
  token,
  baseUrl,
  onBaseUrlChange,
  onClose,
}: BypassQrCodeProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const url = `${baseUrl}/?key=${token}`;

  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'svg',
      data: url,
      margin: 10,
      image: markUrl,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { type: 'extra-rounded', color: '#000000' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
      cornersDotOptions: { type: 'dot', color: '#000000' },
      backgroundOptions: { color: '#ffffff' },
      imageOptions: { margin: 0, imageSize: 0.4, hideBackgroundDots: true },
    });

    container.replaceChildren();
    qrCode.append(container);
    qrCodeRef.current = qrCode;
  }, [url]);

  const download = () => {
    void qrCodeRef.current?.download({
      name: `bypass-token-${token}`,
      extension: 'svg',
    });
  };

  return (
    <>
      <DialogTitle>{t('paywall.form.qrCodeTitle')}</DialogTitle>
      <QrContent>
        <BaseUrl
          fullWidth
          label={t('paywall.form.baseUrl')}
          value={baseUrl}
          onChange={event => onBaseUrlChange(event.target.value)}
        />
        <QRCodeContainer>
          <div ref={containerRef} />
        </QRCodeContainer>
        <TokenUrl>{url}</TokenUrl>
      </QrContent>
      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('close')}
        </Button>
        <Button
          variant="contained"
          onClick={download}
        >
          {t('paywall.form.downloadSvg')}
        </Button>
      </DialogActions>
    </>
  );
}

type BypassQrDialogProps = {
  token: string;
  open: boolean;
  onClose: () => void;
};

export function BypassQrDialog({ token, open, onClose }: BypassQrDialogProps) {
  const [baseUrl, setBaseUrl] = useState('https://example.com');

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
    >
      <BypassQrCode
        token={token}
        baseUrl={baseUrl}
        onBaseUrlChange={setBaseUrl}
        onClose={onClose}
      />
    </Dialog>
  );
}
