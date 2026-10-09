import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLaptopMac, MdPhoneIphone, MdTabletMac } from 'react-icons/md';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTH: Record<Device, number | string> = {
  desktop: '100%',
  tablet: 820,
  mobile: 390,
};

// Preview-only styling so a narrow (mobile/tablet) preview wraps like a real
// device instead of scrolling horizontally on long unbreakable strings.
const PREVIEW_STYLE =
  '<style>html{overflow-x:hidden}img{max-width:100%;height:auto}' +
  '*{overflow-wrap:anywhere;word-break:break-word}</style>';

const withPreviewStyles = (html: string): string =>
  html.includes('</head>') ?
    html.replace('</head>', `${PREVIEW_STYLE}</head>`)
  : `${PREVIEW_STYLE}${html}`;

export interface MailPreviewProps {
  /** Fully composed mail HTML — placeholders already replaced. */
  html: string;
  /** Rendered above the frame when given. */
  subject?: string;
  height?: number | string;
}

/**
 * Renders a composed mail in a device-sized frame. Shared by the template
 * editor's preview modal and the send page, so both show a mail identically.
 */
export function MailPreview({
  html,
  subject,
  height = '100%',
}: MailPreviewProps) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<Device>('desktop');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={device}
        onChange={(_event, next: Device | null) => next && setDevice(next)}
        sx={{ justifyContent: 'center', mb: 1 }}
      >
        <ToggleButton
          value="desktop"
          aria-label={t('mailTemplates.editor.desktop', 'Desktop')}
        >
          <MdLaptopMac />
        </ToggleButton>

        <ToggleButton
          value="tablet"
          aria-label={t('mailTemplates.editor.tablet', 'Tablet')}
        >
          <MdTabletMac />
        </ToggleButton>

        <ToggleButton
          value="mobile"
          aria-label={t('mailTemplates.editor.mobile', 'Mobile')}
        >
          <MdPhoneIphone />
        </ToggleButton>
      </ToggleButtonGroup>

      {subject !== undefined && (
        <div style={{ marginBottom: 8 }}>
          <strong>{t('mailTemplates.subject')}:</strong> {subject || '—'}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
          background: '#f4f4f4',
          borderRadius: 'var(--rs-radius-md)',
        }}
      >
        <iframe
          title="mail-preview"
          srcDoc={withPreviewStyles(html)}
          style={{
            width: DEVICE_WIDTH[device],
            maxWidth: '100%',
            height: '100%',
            border: '1px solid #e5e5ea',
            borderRadius: 'var(--rs-radius-md)',
            background: '#fff',
          }}
        />
      </div>
    </div>
  );
}
