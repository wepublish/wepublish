import { forwardRef, memo, useImperativeHandle, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FullImageFragment } from '@wepublish/editor/api';
import { ImageSelectPanel } from '@wepublish/ui/editor';
import { Drawer } from 'rsuite';
import {
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatSize,
  MdFormatUnderlined,
  MdHorizontalRule,
  MdImage,
  MdLaptopMac,
  MdLink,
  MdPhoneIphone,
  MdPhotoLibrary,
  MdSmartButton,
  MdRedo,
  MdStrikethroughS,
  MdTabletMac,
  MdUndo,
} from 'react-icons/md';
import { useTranslation } from 'react-i18next';

type Device = 'desktop' | 'tablet' | 'mobile';

// Desktop fills the available width (a 600px email then centers within it, as a
// desktop mail client renders it); tablet/mobile use representative modern
// device CSS widths (iPad portrait = 820px, iPhone 14/15 = 390px).
const DEVICE_WIDTH: Record<Device, number | string> = {
  desktop: '100%',
  tablet: 820,
  mobile: 390,
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

// Shared height/width for every toolbar control so they line up uniformly.
const CONTROL_SIZE = 32;

// Square icon buttons and auto-width label buttons, both at the shared height,
// so the whole toolbar reads as one consistent row.
const SQUARE_BUTTON_SX = {
  width: CONTROL_SIZE,
  height: CONTROL_SIZE,
  p: 0,
} as const;

const LABEL_BUTTON_SX = {
  minWidth: CONTROL_SIZE,
  height: CONTROL_SIZE,
  px: 1,
} as const;

// Native color input styled as a compact toolbar swatch.
const ColorSwatch = styled('input')`
  width: ${CONTROL_SIZE}px;
  height: ${CONTROL_SIZE}px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 4px;
  background: none;
  cursor: pointer;
`;

// execCommand('fontSize') uses the legacy 1-7 scale; map to readable labels.
const FONT_SIZES: ReadonlyArray<{ value: string; label: string }> = [
  { value: '1', label: 'XS' },
  { value: '2', label: 'S' },
  { value: '3', label: 'M' },
  { value: '4', label: 'L' },
  { value: '5', label: 'XL' },
  { value: '6', label: 'XXL' },
  { value: '7', label: 'XXXL' },
];

interface LinkDialogState {
  open: boolean;
  url: string;
  text: string;
  newTab: boolean;
}

interface ImageDialogState {
  open: boolean;
  url: string;
  alt: string;
  width: string;
  link: string;
}

interface ButtonDialogState {
  open: boolean;
  text: string;
  url: string;
  color: string;
  size: string;
}

// Email-safe padding/font per button size (inline styles only).
const BUTTON_SIZES: ReadonlyArray<{
  value: string;
  labelKey: string;
  label: string;
  padding: string;
  fontSize: string;
}> = [
  {
    value: 'small',
    labelKey: 'mailTemplates.editor.buttonSizeSmall',
    label: 'Small',
    padding: '8px 16px',
    fontSize: '14px',
  },
  {
    value: 'medium',
    labelKey: 'mailTemplates.editor.buttonSizeMedium',
    label: 'Medium',
    padding: '12px 24px',
    fontSize: '16px',
  },
  {
    value: 'large',
    labelKey: 'mailTemplates.editor.buttonSizeLarge',
    label: 'Large',
    padding: '16px 32px',
    fontSize: '18px',
  },
];

const DEFAULT_BUTTON_COLOR = '#1675e0';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

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
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({
    open: false,
    url: '',
    text: '',
    newTab: true,
  });
  const [imageDialog, setImageDialog] = useState<ImageDialogState>({
    open: false,
    url: '',
    alt: '',
    width: '',
    link: '',
  });
  const [buttonDialog, setButtonDialog] = useState<ButtonDialogState>({
    open: false,
    text: '',
    url: '',
    color: DEFAULT_BUTTON_COLOR,
    size: 'medium',
  });
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [fontSizeAnchor, setFontSizeAnchor] = useState<HTMLElement | null>(
    null
  );
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
      // Give the editable cell a comfortable minimum writing area (editor-only;
      // stripped before saving so it never affects the sent mail).
      style.textContent = '[contenteditable]{outline:none;min-height:360px;}';
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

  // Walks up from the current selection to find the enclosing <a>, so an
  // existing link can be edited (and not just created).
  const getSelectedAnchor = (doc: Document): HTMLAnchorElement | null => {
    const editable = getEditable();
    let node: Node | null = doc.getSelection()?.anchorNode ?? null;
    while (node && node !== editable) {
      if (node.nodeName === 'A') {
        return node as HTMLAnchorElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  // Opening a dialog moves focus out of the iframe and drops its selection, so
  // we snapshot the range first and restore it before running a command.
  const savedRange = useRef<Range | null>(null);
  const editedAnchor = useRef<HTMLAnchorElement | null>(null);

  const saveSelection = () => {
    const selection = getDoc()?.getSelection();
    savedRange.current =
      selection && selection.rangeCount ?
        selection.getRangeAt(0).cloneRange()
      : null;
  };

  const restoreSelection = () => {
    const doc = getDoc();
    const selection = doc?.getSelection();
    if (selection && savedRange.current) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
  };

  // new tab + rel guards against reverse-tabnabbing.
  const sanitizeHref = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    try {
      const parsed = new URL(trimmed, 'https://example.com');
      const protocol = parsed.protocol.toLowerCase();
      if (
        protocol === 'http:' ||
        protocol === 'https:' ||
        protocol === 'mailto:' ||
        protocol === 'tel:'
      ) {
        return trimmed;
      }
      return '';
    } catch {
      return '';
    }
  };

  const applyAnchorAttributes = (
    anchor: HTMLAnchorElement,
    href: string,
    newTab: boolean
  ) => {
    const safeHref = sanitizeHref(href);
    if (!safeHref) {
      return;
    }
    anchor.setAttribute('href', safeHref);
    if (newTab) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    } else {
      anchor.removeAttribute('target');
      anchor.removeAttribute('rel');
    }
  };

  const openLinkDialog = () => {
    const doc = getDoc();
    if (!doc) {
      return;
    }
    getEditable()?.focus();
    saveSelection();
    const anchor = getSelectedAnchor(doc);
    editedAnchor.current = anchor;
    setLinkDialog({
      open: true,
      url: anchor?.getAttribute('href') ?? '',
      text: anchor?.textContent ?? doc.getSelection()?.toString() ?? '',
      // Default new links to open in a new tab.
      newTab: anchor ? anchor.getAttribute('target') === '_blank' : true,
    });
  };

  const closeLinkDialog = () =>
    setLinkDialog(state => ({ ...state, open: false }));

  const applyLink = () => {
    const doc = getDoc();
    if (!doc) {
      closeLinkDialog();
      return;
    }
    const url = linkDialog.url.trim();
    const safeUrl = sanitizeHref(url);
    const { text, newTab } = linkDialog;
    const anchor = editedAnchor.current;
    getEditable()?.focus();
    restoreSelection();

    // Empty URL removes an existing link (and is a no-op otherwise).
    if (!url) {
      if (anchor) {
        doc.execCommand('unlink');
        emit();
      }
      closeLinkDialog();
      return;
    }

    // Invalid or unsafe URLs are ignored.
    if (!safeUrl) {
      closeLinkDialog();
      return;
    }

    if (anchor) {
      applyAnchorAttributes(anchor, safeUrl, newTab);
      if (text && text !== anchor.textContent) {
        anchor.textContent = text;
      }
      emit();
      closeLinkDialog();
      return;
    }

    const selection = doc.getSelection();
    if (selection && !selection.isCollapsed) {
      doc.execCommand('createLink', false, url);
      const created = getSelectedAnchor(doc);
      if (created) {
        applyAnchorAttributes(created, url, newTab);
        if (text && text !== created.textContent) {
          created.textContent = text;
        }
      }
    } else {
      // No selection: insert a fresh anchor labelled with the text (or URL).
      const rel = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      doc.execCommand(
        'insertHTML',
        false,
        `<a href="${escapeAttr(url)}"${rel}>${escapeHtml(text || url)}</a>`
      );
    }
    emit();
    closeLinkDialog();
  };

  const openImageDialog = () => {
    if (!getDoc()) {
      return;
    }
    getEditable()?.focus();
    saveSelection();
    setImageDialog({ open: true, url: '', alt: '', width: '', link: '' });
  };

  const closeImageDialog = () =>
    setImageDialog(state => ({ ...state, open: false }));

  const applyImage = () => {
    const doc = getDoc();
    const url = imageDialog.url.trim();
    if (!doc || !url) {
      closeImageDialog();
      return;
    }
    getEditable()?.focus();
    restoreSelection();
    const width = imageDialog.width.replace(/[^0-9]/g, '');
    const widthAttr = width ? ` width="${width}"` : '';
    const img = `<img src="${escapeAttr(url)}" alt="${escapeAttr(
      imageDialog.alt
    )}"${widthAttr} style="max-width:100%;height:auto;border:0;" />`;
    // Optionally wrap the image in a link so it's clickable in the mail.
    const link = imageDialog.link.trim();
    const html =
      link ?
        `<a href="${escapeAttr(
          link
        )}" target="_blank" rel="noopener noreferrer">${img}</a>`
      : img;
    doc.execCommand('insertHTML', false, html);
    emit();
    closeImageDialog();
  };

  const openButtonDialog = () => {
    if (!getDoc()) {
      return;
    }
    getEditable()?.focus();
    saveSelection();
    setButtonDialog({
      open: true,
      text: getDoc()?.getSelection()?.toString() ?? '',
      url: '',
      color: DEFAULT_BUTTON_COLOR,
      size: 'medium',
    });
  };

  const closeButtonDialog = () =>
    setButtonDialog(state => ({ ...state, open: false }));

  const applyButton = () => {
    const doc = getDoc();
    const url = buttonDialog.url.trim();
    const text = buttonDialog.text.trim();
    if (!doc || !url || !text) {
      closeButtonDialog();
      return;
    }
    getEditable()?.focus();
    restoreSelection();
    const size =
      BUTTON_SIZES.find(s => s.value === buttonDialog.size) ?? BUTTON_SIZES[1];
    // Inline-styled anchor (email clients ignore <style>/classes) rendered as a
    // rounded button. Colour comes from a native color input, so it's safe.
    const style = [
      'display:inline-block',
      `background-color:${buttonDialog.color}`,
      'color:#ffffff',
      `padding:${size.padding}`,
      'border-radius:6px',
      'font-family:Arial,Helvetica,sans-serif',
      `font-size:${size.fontSize}`,
      'font-weight:bold',
      'text-decoration:none',
    ].join(';');
    doc.execCommand(
      'insertHTML',
      false,
      `<a href="${escapeAttr(
        url
      )}" target="_blank" rel="noopener noreferrer" style="${style}">${escapeHtml(
        text
      )}</a>`
    );
    emit();
    closeButtonDialog();
  };

  // Native form controls (color/size) steal focus, so save the range on
  // mousedown and restore it before applying the command.
  const applyWithSavedSelection = (command: string, argument: string) => {
    const doc = getDoc();
    if (!doc) {
      return;
    }
    getEditable()?.focus();
    restoreSelection();
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
        sx={SQUARE_BUTTON_SX}
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
      sx={LABEL_BUTTON_SX}
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

        <Divider
          orientation="vertical"
          flexItem
        />

        {toolButton(
          t('mailTemplates.editor.alignLeft', 'Align left'),
          <MdFormatAlignLeft />,
          'justifyLeft'
        )}
        {toolButton(
          t('mailTemplates.editor.alignCenter', 'Align center'),
          <MdFormatAlignCenter />,
          'justifyCenter'
        )}
        {toolButton(
          t('mailTemplates.editor.alignRight', 'Align right'),
          <MdFormatAlignRight />,
          'justifyRight'
        )}

        <Divider
          orientation="vertical"
          flexItem
        />

        <Tooltip title={t('mailTemplates.editor.fontSize', 'Size')}>
          <ToggleButton
            size="small"
            value="fontSize"
            sx={SQUARE_BUTTON_SX}
            onMouseDown={event => {
              event.preventDefault();
              saveSelection();
              setFontSizeAnchor(event.currentTarget);
            }}
          >
            <MdFormatSize />
          </ToggleButton>
        </Tooltip>
        <Menu
          anchorEl={fontSizeAnchor}
          open={Boolean(fontSizeAnchor)}
          onClose={() => setFontSizeAnchor(null)}
        >
          {FONT_SIZES.map(size => (
            <MenuItem
              key={size.value}
              onClick={() => {
                applyWithSavedSelection('fontSize', size.value);
                setFontSizeAnchor(null);
              }}
            >
              {size.label}
            </MenuItem>
          ))}
        </Menu>

        <Tooltip title={t('mailTemplates.editor.textColor', 'Text color')}>
          <Box
            component="label"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              height: CONTROL_SIZE,
            }}
          >
            <ColorSwatch
              type="color"
              defaultValue="#000000"
              onMouseDown={() => saveSelection()}
              onChange={event =>
                applyWithSavedSelection('foreColor', event.target.value)
              }
            />
          </Box>
        </Tooltip>

        <Divider
          orientation="vertical"
          flexItem
        />

        <Tooltip title={t('mailTemplates.editor.link', 'Link')}>
          <ToggleButton
            size="small"
            value="link"
            sx={SQUARE_BUTTON_SX}
            onMouseDown={event => {
              event.preventDefault();
              openLinkDialog();
            }}
          >
            <MdLink />
          </ToggleButton>
        </Tooltip>

        <Tooltip title={t('mailTemplates.editor.image', 'Image')}>
          <ToggleButton
            size="small"
            value="image"
            sx={SQUARE_BUTTON_SX}
            onMouseDown={event => {
              event.preventDefault();
              openImageDialog();
            }}
          >
            <MdImage />
          </ToggleButton>
        </Tooltip>

        <Tooltip title={t('mailTemplates.editor.button', 'Button')}>
          <ToggleButton
            size="small"
            value="button"
            sx={SQUARE_BUTTON_SX}
            onMouseDown={event => {
              event.preventDefault();
              openButtonDialog();
            }}
          >
            <MdSmartButton />
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
            <ToggleButton
              value="desktop"
              sx={SQUARE_BUTTON_SX}
            >
              <MdLaptopMac />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('mailTemplates.editor.tablet', 'Tablet')}>
            <ToggleButton
              value="tablet"
              sx={SQUARE_BUTTON_SX}
            >
              <MdTabletMac />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('mailTemplates.editor.mobile', 'Mobile')}>
            <ToggleButton
              value="mobile"
              sx={SQUARE_BUTTON_SX}
            >
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

      <Dialog
        open={linkDialog.open}
        onClose={closeLinkDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('mailTemplates.editor.linkTitle', 'Link')}</DialogTitle>
        <DialogContent>
          <Stack
            spacing={2}
            sx={{ mt: 1 }}
          >
            <TextField
              autoFocus
              fullWidth
              size="small"
              label={t('mailTemplates.editor.linkUrl', 'URL')}
              placeholder="https://"
              value={linkDialog.url}
              onChange={event =>
                setLinkDialog(state => ({ ...state, url: event.target.value }))
              }
            />
            <TextField
              fullWidth
              size="small"
              label={t('mailTemplates.editor.linkText', 'Link text')}
              value={linkDialog.text}
              onChange={event =>
                setLinkDialog(state => ({ ...state, text: event.target.value }))
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={linkDialog.newTab}
                  onChange={event =>
                    setLinkDialog(state => ({
                      ...state,
                      newTab: event.target.checked,
                    }))
                  }
                />
              }
              label={t('mailTemplates.editor.linkNewTab', 'Open in a new tab')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLinkDialog}>
            {t('mailTemplates.editor.cancel', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={applyLink}
          >
            {t('mailTemplates.editor.apply', 'Apply')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={imageDialog.open && !libraryOpen}
        onClose={closeImageDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {t('mailTemplates.editor.imageTitle', 'Insert image')}
        </DialogTitle>
        <DialogContent>
          <Stack
            spacing={2}
            sx={{ mt: 1 }}
          >
            <Button
              variant="outlined"
              startIcon={<MdPhotoLibrary />}
              onClick={() => setLibraryOpen(true)}
            >
              {t(
                'mailTemplates.editor.chooseFromLibrary',
                'Choose from library'
              )}
            </Button>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label={t('mailTemplates.editor.imageUrl', 'Image URL')}
              placeholder="https://"
              value={imageDialog.url}
              onChange={event =>
                setImageDialog(state => ({ ...state, url: event.target.value }))
              }
            />
            <TextField
              fullWidth
              size="small"
              label={t('mailTemplates.editor.imageAlt', 'Alternative text')}
              value={imageDialog.alt}
              onChange={event =>
                setImageDialog(state => ({ ...state, alt: event.target.value }))
              }
            />
            <TextField
              fullWidth
              size="small"
              label={t(
                'mailTemplates.editor.imageWidth',
                'Width (px, optional)'
              )}
              value={imageDialog.width}
              onChange={event =>
                setImageDialog(state => ({
                  ...state,
                  width: event.target.value,
                }))
              }
            />
            <TextField
              fullWidth
              size="small"
              label={t('mailTemplates.editor.imageLink', 'Link (optional)')}
              placeholder="https://"
              value={imageDialog.link}
              onChange={event =>
                setImageDialog(state => ({
                  ...state,
                  link: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImageDialog}>
            {t('mailTemplates.editor.cancel', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={applyImage}
          >
            {t('mailTemplates.editor.insert', 'Insert')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={buttonDialog.open}
        onClose={closeButtonDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {t('mailTemplates.editor.buttonTitle', 'Insert button')}
        </DialogTitle>
        <DialogContent>
          <Stack
            spacing={2}
            sx={{ mt: 1 }}
          >
            <TextField
              autoFocus
              fullWidth
              size="small"
              label={t('mailTemplates.editor.buttonText', 'Button text')}
              value={buttonDialog.text}
              onChange={event =>
                setButtonDialog(state => ({
                  ...state,
                  text: event.target.value,
                }))
              }
            />
            <TextField
              fullWidth
              size="small"
              label={t('mailTemplates.editor.buttonUrl', 'Link URL')}
              placeholder="https://"
              value={buttonDialog.url}
              onChange={event =>
                setButtonDialog(state => ({
                  ...state,
                  url: event.target.value,
                }))
              }
            />
            <Stack
              spacing={2}
              alignItems="center"
            >
              <TextField
                select
                size="small"
                label={t('mailTemplates.editor.buttonSize', 'Size')}
                value={buttonDialog.size}
                onChange={event =>
                  setButtonDialog(state => ({
                    ...state,
                    size: event.target.value,
                  }))
                }
                sx={{ minWidth: 140 }}
              >
                {BUTTON_SIZES.map(size => (
                  <MenuItem
                    key={size.value}
                    value={size.value}
                  >
                    {t(size.labelKey, size.label)}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                label={t('mailTemplates.editor.buttonColor', 'Button color')}
                labelPlacement="start"
                control={
                  <ColorSwatch
                    type="color"
                    value={buttonDialog.color}
                    onChange={event =>
                      setButtonDialog(state => ({
                        ...state,
                        color: event.target.value,
                      }))
                    }
                    style={{ marginLeft: 8 }}
                  />
                }
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeButtonDialog}>
            {t('mailTemplates.editor.cancel', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={applyButton}
          >
            {t('mailTemplates.editor.insert', 'Insert')}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        open={libraryOpen}
        size="sm"
        onClose={() => setLibraryOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setLibraryOpen(false)}
          onSelect={(image: FullImageFragment) => {
            setImageDialog(state => ({
              ...state,
              url: image.largeURL ?? image.url,
            }));
            setLibraryOpen(false);
          }}
        />
      </Drawer>
    </EditorWrapper>
  );
});

export const HtmlVisualEditor = memo(HtmlVisualEditorComponent);
