import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLaptopMac, MdPhoneIphone, MdTabletMac } from 'react-icons/md';
import { IconButton, Stack } from 'rsuite';

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

  const deviceProps = (value: Device, label: string) => ({
    size: 'sm' as const,
    title: label,
    appearance: (device === value ? 'primary' : 'default') as
      | 'primary'
      | 'default',
    onClick: () => setDevice(value),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      <Stack
        spacing={4}
        justifyContent="center"
        style={{ marginBottom: 8 }}
      >
        <IconButton
          icon={<MdLaptopMac />}
          {...deviceProps(
            'desktop',
            t('mailTemplates.editor.desktop', 'Desktop')
          )}
        />
        <IconButton
          icon={<MdTabletMac />}
          {...deviceProps('tablet', t('mailTemplates.editor.tablet', 'Tablet'))}
        />
        <IconButton
          icon={<MdPhoneIphone />}
          {...deviceProps('mobile', t('mailTemplates.editor.mobile', 'Mobile'))}
        />
      </Stack>

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
            borderRadius: 6,
            background: '#fff',
          }}
        />
      </div>
    </div>
  );
}
