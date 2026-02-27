import styled from '@emotion/styled';
import { InlineFormat } from '@wepublish/richtext';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdLinkOff } from 'react-icons/md';
import {
  Button,
  ButtonToolbar,
  Col as RCol,
  Form,
  IconButton,
  InputGroup,
  Row,
} from 'rsuite';
import {
  type Element as ElementType,
  Editor,
  Element,
  Range,
  Transforms,
} from 'slate';
import { useSlate } from 'slate-react';

import { SubMenuContext } from '../../../atoms/toolbar';
import { WepublishEditor } from '../editor/wepublishEditor';

const { Group, Control, ControlLabel, HelpText } = Form;

const Select = styled.select`
  background-color: white;
  border: none;
  box-shadow: none;
`;

const Col = styled(RCol)`
  text-align: right;
  margin-top: 0px;
`;

export function LinkMenu() {
  const editor = useSlate();

  const { closeMenu } = useContext(SubMenuContext);

  const [title, setTitle] = useState('');
  const [url, setURL] = useState('');
  const [id, setId] = useState('');

  enum prefixType {
    http = 'http://',
    https = 'https://',
    mailto = 'mailto:',
    other = 'other',
  }

  const [prefix, setPrefix] = useState<prefixType | string>(prefixType.http);

  const [selection, setSelection] = useState<Range | null>(null);

  const [isValidURL, setIsValidURL] = useState(false);
  const [isValidMail, setIsValidMail] = useState(false);
  const isDisabled = !url || !title;

  const { t } = useTranslation();

  useEffect(() => {
    if (prefix === prefixType.mailto) {
      validateMail(url).then(value => setIsValidMail(value));
    } else {
      validateURL(url).then(value => setIsValidURL(value));
    }

    if (url.startsWith(prefixType.https)) {
      setPrefix(prefixType.https);
      setURL(url.replace(prefixType.https, ''));
    } else if (url.startsWith(prefixType.http)) {
      setPrefix(prefixType.http);
      setURL(url.replace(prefixType.http, ''));
    } else if (url.startsWith(prefixType.mailto)) {
      setPrefix(prefixType.mailto);
      setURL(url.replace(prefixType.mailto, ''));
    }
  }, [url]);

  useEffect(() => {
    setSelection(editor.selection);

    const nodes = Array.from(
      WepublishEditor.nodes(editor, {
        at: editor.selection ?? undefined,
        match: node =>
          Element.isElement(node) && node.type === InlineFormat.Link,
      })
    ) as ElementType[][];

    const tuple = nodes[0];
    if (tuple) {
      const [node] = tuple;
      setTitle((node.title as string) ?? '');

      const nodeUrl = node.url as string;
      if (
        !nodeUrl.startsWith(prefixType.https) &&
        !nodeUrl.startsWith(prefixType.http) &&
        !nodeUrl.startsWith(prefixType.mailto)
      ) {
        setPrefix(prefixType.other);
      }
      setURL((nodeUrl as string) ?? '');

      setId((node.id as string) ?? '');
    } else if (editor.selection) {
      const text = Editor.string(editor, editor.selection);
      setTitle(text ?? '');
    }
  }, []);

  return (
    <>
      <Row>
        <Col xs={24}>
          <IconButton
            icon={<MdClose />}
            onClick={() => closeMenu()}
          />
        </Col>
      </Row>
      <Form fluid>
        <Group controlId="link">
          <ControlLabel>{t('blocks.richText.link')}</ControlLabel>
          <InputGroup>
            <Select
              value={prefix}
              onChange={e => {
                setPrefix(e.target.value);
              }}
            >
              <option value={prefixType.http}>{prefixType.http}</option>
              <option value={prefixType.https}>{prefixType.https}</option>
              <option value={prefixType.mailto}>{prefixType.mailto}</option>
              <option value={prefixType.other}>{prefixType.other}</option>
            </Select>

            <Control
              name="url"
              value={url}
              onChange={(url: string) => setURL(url)}
            />
          </InputGroup>
          {prefix !== prefixType.mailto && url && !isValidURL ?
            <HelpText> {t('blocks.richText.invalidLink')}</HelpText>
          : undefined}
          {prefix === prefixType.mailto && url && !isValidMail ?
            <HelpText> {t('blocks.richText.invalidMail')} </HelpText>
          : undefined}
        </Group>
        <Group controlId="text">
          <ControlLabel>{t('blocks.richText.text')}</ControlLabel>
          <Control
            name="title"
            value={title}
            onChange={(title: string) => {
              setTitle(title);
            }}
          />
        </Group>
        <Group controlId="id">
          <ControlLabel>{t('blocks.richText.id')}</ControlLabel>
          <Control
            name="id"
            value={id}
            onChange={(id: string) => {
              setId(id);
            }}
          />
        </Group>
        <ButtonToolbar>
          <Button
            disabled={isDisabled}
            onClick={e => {
              e.preventDefault();
              insertLink(
                editor,
                selection,
                prefix !== prefixType.other ? prefix + url : url,
                title || undefined
              );
              closeMenu();
            }}
          >
            {t('blocks.richText.insert')}
          </Button>
          <RemoveLinkFormatButton />
        </ButtonToolbar>
      </Form>
    </>
  );
}

async function validateMail(mail: string) {
  if (mail) {
    const pattern = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$', 'i');
    return pattern.test(mail);
  }
  return false;
}

async function validateURL(url: string) {
  if (url) {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    );
    return pattern.test(url);
  }
  return false;
}

export function RemoveLinkFormatButton() {
  const editor = useSlate();
  const { closeMenu } = useContext(SubMenuContext);

  const { t } = useTranslation();

  return (
    <IconButton
      icon={<MdLinkOff />}
      active={WepublishEditor.isFormatActive(editor, InlineFormat.Link)}
      disabled={!WepublishEditor.isFormatActive(editor, InlineFormat.Link)}
      onMouseDown={() => {
        removeLink(editor);
        closeMenu();
      }}
    >
      {t('blocks.richText.remove')}
    </IconButton>
  );
}

function insertLink(
  editor: Editor,
  selection: Range | null,
  url: string,
  title?: string
) {
  if (selection) {
    if (Range.isCollapsed(selection)) {
      const nodes = Array.from(
        WepublishEditor.nodes(editor, {
          at: selection,
          match: node =>
            Element.isElement(node) && node.type === InlineFormat.Link,
        })
      );
      const tuple = nodes[0];

      if (tuple) {
        const [, path] = tuple;
        Transforms.select(editor, path);
      } else {
        Transforms.insertText(editor, title ?? '');
        Transforms.select(editor, {
          anchor: {
            path: selection.anchor.path,
            offset: selection.anchor.offset + (title?.length ?? 0),
          },
          focus: { path: selection.focus.path, offset: selection.focus.offset },
        });
      }
    } else {
      Transforms.select(editor, selection);
    }
  }
  Transforms.unwrapNodes(editor, {
    match: node => Element.isElement(node) && node.type === InlineFormat.Link,
  });
  Transforms.wrapNodes(
    editor,
    { type: InlineFormat.Link, url, title, children: [] },
    { split: true }
  );
  Transforms.collapse(editor, { edge: 'end' });

  const pointAfterLink = Editor.after(editor, selection!.focus, {
    distance: 1,
    unit: 'offset',
  });
  if (pointAfterLink) {
    Transforms.insertNodes(editor, { text: '' }, { at: pointAfterLink });
    Transforms.move(editor, { distance: 1, unit: 'offset' });
  }
}

function removeLink(editor: Editor) {
  Transforms.unwrapNodes(editor, {
    match: node => Element.isElement(node) && node.type === InlineFormat.Link,
  });
}
