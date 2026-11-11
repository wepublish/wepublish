import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { enqueueSnackbar, IconButtonTooltip } from '@wepublish/ui/editor';
import { FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdContentCopy,
  MdExpandMore,
  MdMenuBook,
  MdOpenInNew,
} from 'react-icons/md';

import { GuideStep } from './providerGuides';

export const SetupGuideSteps = styled.ol`
  margin: 0;
  padding-left: 24px;
  display: grid;
  gap: 12px;

  li::marker {
    font-weight: 600;
  }
`;

export const SetupGuideStep = styled.li`
  display: grid;
  gap: 8px;
`;

const hostOf = (href: string) => {
  try {
    return new URL(href).host;
  } catch {
    return href;
  }
};

function WebhookUrl({ url }: { url: string }) {
  const { t } = useTranslation();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      enqueueSnackbar(t('integrations.guide.copied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('integrations.guide.copyFailed'), {
        variant: 'error',
      });
    }
  };

  return (
    <TextField
      value={url}
      size="small"
      fullWidth
      slotProps={{
        htmlInput: {
          readOnly: true,
          'aria-label': t('integrations.guide.webhookUrl'),
          onFocus: (event: FocusEvent<HTMLInputElement>) =>
            event.target.select(),
          sx: { fontFamily: 'monospace', fontSize: '0.85em' },
        },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButtonTooltip caption={t('integrations.guide.copyUrl')}>
                <IconButton
                  size="small"
                  aria-label={t('integrations.guide.copyUrl')}
                  onClick={copy}
                >
                  <MdContentCopy />
                </IconButton>
              </IconButtonTooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function SetupGuide({
  provider,
  steps,
  defaultExpanded,
}: {
  provider: string;
  steps: GuideStep[];
  defaultExpanded?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Accordion
      variant="outlined"
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{ borderRadius: 0.75, '&::before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<MdExpandMore />}>
        <Typography
          component="span"
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            fontWeight: 600,
          }}
        >
          <MdMenuBook aria-hidden />
          {t('integrations.guide.title', { provider })}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <SetupGuideSteps>
          {steps.map(step => (
            <SetupGuideStep key={step.text}>
              <Typography variant="body2">{step.text}</Typography>

              {step.href && (
                <Link
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    justifySelf: 'start',
                  }}
                >
                  {t('integrations.guide.open', { host: hostOf(step.href) })}
                  <MdOpenInNew aria-hidden />
                </Link>
              )}

              {step.webhookUrl && <WebhookUrl url={step.webhookUrl} />}
            </SetupGuideStep>
          ))}
        </SetupGuideSteps>
      </AccordionDetails>
    </Accordion>
  );
}
