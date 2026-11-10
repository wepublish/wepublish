import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAttachFile,
  MdLaptopMac,
  MdPhoneIphone,
  MdTabletMac,
} from 'react-icons/md';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { LetterPreview } from './letter-preview';

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

export interface MailPreviewAttachment {
  /** The name the mail attaches the pdf under. */
  filename: string;
  /** The pdf, base64 encoded, as the mail carries it. */
  pdf: string;
}

export interface MailPreviewProps {
  /** Fully composed mail HTML — placeholders already replaced. */
  html: string;
  /** Rendered above the frame when given. */
  subject?: string;
  /** Listed with the subject, like a mail client does; each opens as pdf. */
  attachments?: MailPreviewAttachment[];
  height?: number | string;
}

/**
 * Renders a composed mail in a device-sized frame. Shared by the template
 * editor's preview modal and the send page, so both show a mail identically.
 */
export function MailPreview({
  html,
  subject,
  attachments = [],
  height = '100%',
}: MailPreviewProps) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<Device>('desktop');
  // By position, so a refetched preview shows its own render of the document.
  const [openAttachment, setOpenAttachment] = useState<number | null>(null);
  const opened =
    openAttachment === null ? undefined : attachments[openAttachment];

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

      {attachments.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <strong>{t('mailTemplates.editor.attachments')}:</strong>
          {attachments.map((attachment, index) => (
            <Chip
              key={index}
              icon={<MdAttachFile />}
              label={attachment.filename}
              variant="outlined"
              size="small"
              onClick={() => setOpenAttachment(index)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!opened}
        onClose={() => setOpenAttachment(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>{opened?.filename}</DialogTitle>
        <DialogContent>
          {opened && (
            <LetterPreview
              pdf={opened.pdf}
              title={opened.filename}
              height="75vh"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAttachment(null)}>
            {t('mailTemplates.editor.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
          background: '#f4f4f4',
          borderRadius: 0.75,
        }}
      >
        <iframe
          title={t('mailTemplates.edit.preview')}
          srcDoc={withPreviewStyles(html)}
          style={{
            width: DEVICE_WIDTH[device],
            maxWidth: '100%',
            height: '100%',
            border: '1px solid #e5e5ea',
            borderRadius: 0.75,
            background: '#fff',
          }}
        />
      </div>
    </div>
  );
}
