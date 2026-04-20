import styled from '@emotion/styled';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Wrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  max-width: 600px;
`;

const QrCodeImage = styled('img')`
  display: block;
  margin: 0 auto;
  max-width: 200px;
`;

const SecretCode = styled('code')`
  display: block;
  text-align: center;
  font-size: 14px;
  padding: ${({ theme }) => theme.spacing(1)};
  background: ${({ theme }) => theme.palette.grey[100]};
  border-radius: 4px;
  word-break: break-all;
`;

const AppLinksText = styled('p')`
  font-size: 13px;
  color: ${({ theme }) => theme.palette.text.secondary};
  a {
    color: ${({ theme }) => theme.palette.primary.main};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export type TotpSetupProps = {
  className?: string;
  totpEnabled: boolean;
  onSetup: () => Promise<{ qrCode: string; secret: string } | null>;
  onEnable: (totpToken: string) => Promise<boolean>;
};

export function TotpSetup({
  className,
  totpEnabled,
  onSetup,
  onEnable,
}: TotpSetupProps) {
  const {
    elements: { TextField, Alert, Button, H5 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  async function handleStartSetup() {
    setLoading(true);
    setError(undefined);
    try {
      const result = await onSetup();
      if (result) {
        setQrCode(result.qrCode);
        setSecret(result.secret);
        setShowSetup(true);
      }
    } catch (e: any) {
      setError(e?.message || t('user.totp.setupError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleEnable() {
    setLoading(true);
    setError(undefined);
    try {
      const result = await onEnable(totpToken);
      if (result) {
        setSuccess(true);
        setShowSetup(false);
      }
    } catch (e: any) {
      setError(e?.message || t('user.totp.invalidCode'));
      setTotpToken('');
    } finally {
      setLoading(false);
    }
  }

  if (totpEnabled || success) {
    return (
      <Wrapper className={className}>
        <H5>{t('user.totp.title')}</H5>
        <Alert severity="success">{t('user.totp.enabled')}</Alert>
      </Wrapper>
    );
  }

  if (showSetup) {
    return (
      <Wrapper className={className}>
        <H5>{t('user.totp.title')}</H5>
        <Alert severity="info">{t('user.totp.setupDescription')}</Alert>

        <AppLinksText>
          {t('user.totp.downloadApp')}{' '}
          <a
            href="https://play.google.com/store/apps/details?id=proton.android.authenticator"
            target="_blank"
            rel="noopener noreferrer"
          >
            Android
          </a>
          {' | '}
          <a
            href="https://apps.apple.com/app/proton-authenticator/id6741758667"
            target="_blank"
            rel="noopener noreferrer"
          >
            iOS
          </a>
        </AppLinksText>

        <Alert severity="warning">{t('user.totp.backupHint')}</Alert>

        {qrCode && (
          <QrCodeImage
            src={qrCode}
            alt="TOTP QR Code"
          />
        )}

        {secret && (
          <>
            <Alert severity="info">{t('user.totp.manualEntry')}</Alert>
            <SecretCode>{secret}</SecretCode>
          </>
        )}

        <TextField
          value={totpToken}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTotpToken(e.target.value)
          }
          autoComplete="one-time-code"
          fullWidth
          label={t('user.totp.code')}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          disabled={loading || !totpToken}
          onClick={handleEnable}
          type="button"
        >
          {t('user.totp.activate')}
        </Button>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={className}>
      <H5>{t('user.totp.title')}</H5>
      <Alert severity="info">{t('user.totp.optionalDescription')}</Alert>

      {error && <Alert severity="error">{error}</Alert>}

      <Button
        disabled={loading}
        onClick={handleStartSetup}
        type="button"
      >
        {t('user.totp.setup')}
      </Button>
    </Wrapper>
  );
}
