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

const EDITABLE_SELECTOR = '.mail-body';
const EDITOR_STYLE_ID = '__wepublish_editor_only';

// The contenteditable attribute and editor-only styles must never end up in the
// saved/sent template HTML.
const serializeDocument = (doc: Document): string => {
  const clone = doc.documentElement.cloneNode(true) as HTMLElement;

  // Remove browser-extension injected nodes (e.g. Grammarly) that otherwise
  // leak into the saved/sent template HTML.
  clone
    .querySelectorAll(
      'grammarly-desktop-integration, [data-grammarly-shadow-root]'
    )
    .forEach(el => el.remove());

  // Strip editor-only and extension-injected attributes.
  clone.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (
        /^data-(new-)?gr/i.test(attr.name) ||
        attr.name === 'spellcheck' ||
        attr.name === 'contenteditable'
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Remove the editor-only style and any empty style tags.
  clone.querySelector(`#${EDITOR_STYLE_ID}`)?.remove();
  clone.querySelectorAll('style').forEach(style => {
    if (!style.textContent?.trim()) {
      style.remove();
    }
  });

  return `<!DOCTYPE html>\n${clone.outerHTML}`;
};

const HtmlVisualEditorComponent = forwardRef<
  HtmlVisualEditorHandle,
  HtmlVisualEditorProps
>(function HtmlVisualEditor({ value, onChange }, ref) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<Device>('desktop');
  const frameRef = useRef<HTMLIFrameElement>(null);

  const getDoc = (): Document | null =>
    frameRef.current?.contentDocument ?? null;

  // Prefer the dedicated body cell of our own shell; fall back to the document
  // body for templates authored elsewhere (which have no `.mail-body`).
  const getEditable = (): HTMLElement | null => {
    const doc = getDoc();
    if (!doc) {
      return null;
    }
    return doc.querySelector<HTMLElement>(EDITABLE_SELECTOR) ?? doc.body;
  };

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
    // Only the body cell is editable — keeping the surrounding table/shell
    // intact so backspacing at the start can't delete the email structure.
    const editable = getEditable();
    if (editable) {
      editable.setAttribute('contenteditable', 'true');
    }
    // Editor-only styling (focus ring removal) — stripped before saving.
    if (!doc.getElementById(EDITOR_STYLE_ID)) {
      const style = doc.createElement('style');
      style.id = EDITOR_STYLE_ID;
      style.textContent = '[contenteditable]{outline:none;}';
      doc.head.appendChild(style);
    }
    try {
      // Prefer tags (e.g. <b>) over inline styles for mail-friendly output.
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
    getEditable()?.focus();
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
        getEditable()?.focus();
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
        {toolButton(t('mailTemplates.editor.undo', 'Undo'), <MdUndo />, 'undo')}
        {toolButton(t('mailTemplates.editor.redo', 'Redo'), <MdRedo />, 'redo')}

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

        {toolButton(
          t('mailTemplates.editor.bold', 'Bold'),
          <MdFormatBold />,
          'bold'
        )}
        {toolButton(
          t('mailTemplates.editor.italic', 'Italic'),
          <MdFormatItalic />,
          'italic'
        )}
        {toolButton(
          t('mailTemplates.editor.underline', 'Underline'),
          <MdFormatUnderlined />,
          'underline'
        )}
        {toolButton(
          t('mailTemplates.editor.strikethrough', 'Strikethrough'),
          <MdStrikethroughS />,
          'strikeThrough'
        )}

        <Divider
          orientation="vertical"
          flexItem
        />

        {toolButton(
          t('mailTemplates.editor.bulletedList', 'Bulleted list'),
          <MdFormatListBulleted />,
          'insertUnorderedList'
        )}
        {toolButton(
          t('mailTemplates.editor.numberedList', 'Numbered list'),
          <MdFormatListNumbered />,
          'insertOrderedList'
        )}
        {toolButton(
          t('mailTemplates.editor.horizontalRule', 'Horizontal rule'),
          <MdHorizontalRule />,
          'insertHorizontalRule'
        )}

        <Tooltip title={t('mailTemplates.editor.link', 'Link')}>
          <ToggleButton
            size="small"
            value="link"
            onMouseDown={event => {
              event.preventDefault();
              const url = window.prompt(
                t('mailTemplates.editor.linkPrompt', 'Enter the link URL') ?? ''
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
          <Tooltip title={t('mailTemplates.editor.desktop', 'Desktop')}>
            <ToggleButton value="desktop">
              <MdLaptopMac />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('mailTemplates.editor.tablet', 'Tablet')}>
            <ToggleButton value="tablet">
              <MdTabletMac />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('mailTemplates.editor.mobile', 'Mobile')}>
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
