import { forwardRef, memo, useImperativeHandle, useRef, useState } from 'react';
import {
  Box,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatUnderlined,
  MdHorizontalRule,
  MdLaptopMac,
  MdLink,
  MdPhoneIphone,
  MdRedo,
  MdStrikethroughS,
  MdTabletMac,
  MdUndo,
} from 'react-icons/md';
import { useTranslation } from 'react-i18next';

type Device = 'desktop' | 'tablet' | 'mobile';

// Desktop fills the available width (a 600px email then centers within it, as a
// desktop mail client renders it); tablet/mobile use standard device CSS widths
// (iPad portrait = 768px, iPhone = 375px).
const DEVICE_WIDTH: Record<Device, number | string> = {
  desktop: '100%',
  tablet: 768,
  mobile: 375,
};

const EditorWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 480px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 6px;
  background-color: #fff;
  overflow: hidden;
`;

const Toolbar = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 6px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  flex-shrink: 0;
`;

const ToolbarSpacer = styled(Box)`
  flex: 1;
`;

const Canvas = styled(Box)`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px 16px;
  background-color: ${({ theme }) => theme.palette.grey[100]};
  display: flex;
  justify-content: center;
`;

const DeviceFrame = styled(Box)`
  width: 100%;
  align-self: stretch;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: max-width 0.2s ease;
`;

const Frame = styled('iframe')`
  width: 100%;
  height: 100%;
  min-height: 360px;
  border: 0;
  display: block;
`;

export interface HtmlVisualEditorHandle {
  insertToken: (text: string) => void;
}

export interface HtmlVisualEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const serializeDocument = (doc: Document): string =>
  `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;

const HtmlVisualEditorComponent = forwardRef<
  HtmlVisualEditorHandle,
  HtmlVisualEditorProps
>(function HtmlVisualEditor({ value, onChange }, ref) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<Device>('desktop');
  const frameRef = useRef<HTMLIFrameElement>(null);

  const getDoc = (): Document | null =>
    frameRef.current?.contentDocument ?? null;

  const emit = () => {
    const doc = getDoc();
    if (doc) {
      onChange(serializeDocument(doc));
    }
  };

  const handleLoad = () => {
    const doc = getDoc();
    if (!doc) {
      return;
    }
    // Make the rendered email directly editable and prefer tags (e.g. <b>)
    // over inline styles so the output stays mail-client friendly.
    doc.designMode = 'on';
    try {
      doc.execCommand('styleWithCSS', false, 'false');
    } catch {
      // ignore — not supported everywhere
    }
    doc.addEventListener('input', emit);
  };

  const exec = (command: string, argument?: string) => {
    const doc = getDoc();
    if (!doc) {
      return;
    }
    frameRef.current?.contentWindow?.focus();
    doc.execCommand(command, false, argument);
    emit();
  };

  useImperativeHandle(
    ref,
    () => ({
      insertToken: (text: string) => {
        const doc = getDoc();
        if (!doc) {
          return;
        }
        frameRef.current?.contentWindow?.focus();
        doc.execCommand('insertText', false, text);
        emit();
      },
    }),
    []
  );

  const toolButton = (
    title: string,
    icon: JSX.Element,
    command: string,
    argument?: string
  ) => (
    <Tooltip title={title}>
      <ToggleButton
        size="small"
        value={command + (argument ?? '')}
        onMouseDown={event => {
          event.preventDefault();
          exec(command, argument);
        }}
      >
        {icon}
      </ToggleButton>
    </Tooltip>
  );

  const headingButton = (label: string, block: string) => (
    <ToggleButton
      size="small"
      value={block}
      onMouseDown={event => {
        event.preventDefault();
        exec('formatBlock', block);
      }}
    >
      {label}
    </ToggleButton>
  );

  return (
    <EditorWrapper>
      <Toolbar>
        {toolButton(t('mailTemplates.editor.undo'), <MdUndo />, 'undo')}
        {toolButton(t('mailTemplates.editor.redo'), <MdRedo />, 'redo')}

        <Divider
          orientation="vertical"
          flexItem
        />

        {headingButton('H1', 'H1')}
        {headingButton('H2', 'H2')}
        {headingButton('H3', 'H3')}
        {headingButton('T', 'P')}

        <Divider
          orientation="vertical"
          flexItem
        />

        {toolButton(t('mailTemplates.editor.bold'), <MdFormatBold />, 'bold')}
        {toolButton(
          t('mailTemplates.editor.italic'),
          <MdFormatItalic />,
          'italic'
        )}
        {toolButton(
          t('mailTemplates.editor.underline'),
          <MdFormatUnderlined />,
          'underline'
        )}
        {toolButton(
          t('mailTemplates.editor.strikethrough'),
          <MdStrikethroughS />,
          'strikeThrough'
        )}

        <Divider
          orientation="vertical"
          flexItem
        />

        {toolButton(
          t('mailTemplates.editor.bulletedList'),
          <MdFormatListBulleted />,
          'insertUnorderedList'
        )}
        {toolButton(
          t('mailTemplates.editor.numberedList'),
          <MdFormatListNumbered />,
          'insertOrderedList'
        )}
        {toolButton(
          t('mailTemplates.editor.horizontalRule'),
          <MdHorizontalRule />,
          'insertHorizontalRule'
        )}

        <Tooltip title={t('mailTemplates.editor.link')}>
          <ToggleButton
            size="small"
            value="link"
            onMouseDown={event => {
              event.preventDefault();
              const url = window.prompt(
                t('mailTemplates.editor.linkPrompt') ?? ''
              );
              if (url) {
                exec('createLink', url);
              }
            }}
          >
            <MdLink />
          </ToggleButton>
        </Tooltip>

        <ToolbarSpacer />

        <ToggleButtonGroup
          size="small"
          exclusive
          value={device}
          onChange={(_event, next: Device | null) => next && setDevice(next)}
        >
          <Tooltip title={t('mailTemplates.editor.desktop')}>
            <ToggleButton value="desktop">
              <MdLaptopMac />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('mailTemplates.editor.tablet')}>
            <ToggleButton value="tablet">
              <MdTabletMac />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('mailTemplates.editor.mobile')}>
            <ToggleButton value="mobile">
              <MdPhoneIphone />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Toolbar>

      <Canvas>
        <DeviceFrame sx={{ maxWidth: DEVICE_WIDTH[device] }}>
          <Frame
            ref={frameRef}
            title="mail-template-visual-editor"
            sandbox="allow-same-origin"
            srcDoc={value}
            onLoad={handleLoad}
          />
        </DeviceFrame>
      </Canvas>
    </EditorWrapper>
  );
});

export const HtmlVisualEditor = memo(HtmlVisualEditorComponent);
