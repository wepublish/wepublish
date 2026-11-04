import styled from '@emotion/styled';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Wrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  max-width: 600px;
`;

const LinkRow = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export type ReferralLinkProps = {
  className?: string;
  referralLink: string;
  onCopy: (referralLink: string) => Promise<void>;
  /** For a surrounding section that already names it. */
  hideTitle?: boolean;
};

export function ReferralLink({
  className,
  referralLink,
  onCopy,
  hideTitle,
}: ReferralLinkProps) {
  const {
    elements: { TextField, Button, H5, Paragraph, Alert },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function handleCopy() {
    setError(false);

    try {
      await onCopy(referralLink);
      setCopied(true);
    } catch {
      setError(true);
    }
  }

  return (
    <Wrapper className={className}>
      {!hideTitle && <H5 component="h2">{t('user.referral.title')}</H5>}
      <Paragraph gutterBottom={false}>
        {t('user.referral.description')}
      </Paragraph>

      <LinkRow>
        <TextField
          value={referralLink}
          label={t('user.referral.link')}
          slotProps={{ htmlInput: { readOnly: true } }}
          onFocus={event => event.target.select()}
          fullWidth
        />

        <Button
          variant="outlined"
          onClick={handleCopy}
        >
          {t('user.referral.copy')}
        </Button>
      </LinkRow>

      {copied && <Alert severity="success">{t('user.referral.copied')}</Alert>}
      {error && <Alert severity="error">{t('user.referral.copyError')}</Alert>}
    </Wrapper>
  );
}
