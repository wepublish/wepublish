import { memo, useMemo, useState } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdLaptopMac, MdPhoneIphone, MdTabletMac } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useMailTemplatePlaceholdersQuery } from '@wepublish/editor/api';
import { DEFAULT_QUERY_OPTIONS } from '../common';
import {
  applyPlaceholderExamples,
  getPlaceholderSyntax,
} from './placeholder-syntax';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTH: Record<Device, number> = {
  desktop: 640,
  tablet: 480,
  mobile: 375,
};

const PreviewContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const PreviewStage = styled(Box)`
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 16px;
  background-color: ${({ theme }) => theme.palette.grey[100]};
  overflow: auto;
`;

const DeviceFrame = styled(Box)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: width 0.2s ease;
`;

const PreviewFrame = styled('iframe')`
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
`;

interface MailTemplatePreviewProps {
  html: string;
  providerType?: string | null;
}

function MailTemplatePreviewComponent({
  html,
  providerType,
}: MailTemplatePreviewProps) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<Device>('desktop');

  const { data } = useMailTemplatePlaceholdersQuery(DEFAULT_QUERY_OPTIONS());

  const examples = useMemo(() => {
    const map: Record<string, string> = {};
    for (const group of data?.mailTemplatePlaceholders ?? []) {
      for (const placeholder of group.placeholders) {
        map[placeholder.key] = placeholder.example;
      }
    }
    return map;
  }, [data]);

  const previewHtml = useMemo(
    () =>
      applyPlaceholderExamples(
        html,
        examples,
        getPlaceholderSyntax(providerType)
      ),
    [html, examples, providerType]
  );

  return (
    <PreviewContainer>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
        }}
      >
        <Typography variant="subtitle2">
          {t('mailTemplates.editor.preview')}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={device}
          onChange={(_event, value: Device | null) => value && setDevice(value)}
        >
          <ToggleButton value="desktop">
            <MdLaptopMac />
          </ToggleButton>
          <ToggleButton value="tablet">
            <MdTabletMac />
          </ToggleButton>
          <ToggleButton value="mobile">
            <MdPhoneIphone />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <PreviewStage>
        <DeviceFrame sx={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}>
          <PreviewFrame
            title={t('mailTemplates.editor.preview') ?? 'preview'}
            srcDoc={previewHtml}
            sandbox=""
          />
        </DeviceFrame>
      </PreviewStage>
    </PreviewContainer>
  );
}

export const MailTemplatePreview = memo(MailTemplatePreviewComponent);
