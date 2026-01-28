import styled from '@emotion/styled';
import { BlockFormat } from '@wepublish/richtext';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdDisabledByDefault } from 'react-icons/md';
import {
  Button,
  Col as RCol,
  IconButton,
  InputGroup as RInputGroup,
  InputNumber,
  Row,
} from 'rsuite';
import { Element, Transforms } from 'slate';
import { useSlate } from 'slate-react';

import { ColorPicker } from '../../../atoms/colorPicker';
import { ControlsContainer, SubMenuContext } from '../../../atoms/toolbar';
import { DEFAULT_BORDER_COLOR, emptyCellsTable } from '../editor/elements';
import { WepublishEditor } from '../editor/wepublishEditor';

const ControlsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  height: 10em;
  width: 15em;
`;

const Col = styled(RCol)`
  text-align: right;
  margin-top: 0px;
  margin-bottom: 20px;
`;

const RedIcon = styled(MdDisabledByDefault)`
  color: #ff0000;
`;

const InputGroup = styled(RInputGroup)`
  width: 150px;
`;

const InputAddon = styled(RInputGroup.Addon)`
  width: 80px;
`;

export function TableMenu() {
  const editor = useSlate();

  const { closeMenu } = useContext(SubMenuContext);

  const [nrows, setNrows] = useState(2);
  const [ncols, setNcols] = useState(1);
  const [borderColor, setBorderColor] = useState<string>();

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    const nodes = WepublishEditor.nodes(editor, {
      match: node =>
        Element.isElement(node) && node.type === BlockFormat.TableCell,
    });

    for (const [node] of nodes) {
      if (Element.isElement(node)) {
        setBorderColor(node.borderColor as string);
        return;
      }
    }
  }, [editor.selection]);

  useEffect(() => {
    if (borderColor) {
      const nodes = WepublishEditor.nodes(editor, {
        match: node =>
          Element.isElement(node) && node.type === BlockFormat.Table,
      });

      for (const [, path] of nodes) {
        Transforms.setNodes(
          editor,
          { borderColor },
          {
            at: path,
            match: node =>
              Element.isElement(node) && node.type === BlockFormat.TableCell,
          }
        );
        return;
      }
    }
  }, [borderColor]);

  const tableInsertControls = (
    <>
      {[
        {
          label: t('blocks.richTextTable.rows'),
          num: nrows,
          setNumber: setNrows,
        },
        {
          label: t('blocks.richTextTable.columns'),
          num: ncols,
          setNumber: setNcols,
        },
      ].map(({ label, num, setNumber }, i) => (
        <InputGroup
          disabled={WepublishEditor.isFormatActive(editor, BlockFormat.Table)}
          key={i}
        >
          <InputAddon>{label}</InputAddon>
          <InputNumber
            value={num}
            onChange={val => setNumber(val as number)}
            min={1}
            max={100}
          />
        </InputGroup>
      ))}
      <Button
        onClick={() => {
          Transforms.insertNodes(editor, emptyCellsTable(nrows, ncols));
        }}
      >
        {t('blocks.richTextTable.insertTable')}
      </Button>
    </>
  );

  const removeTable = () => {
    Transforms.removeNodes(editor, {
      at: editor.selection ?? undefined,
      match: node => Element.isElement(node) && node.type === BlockFormat.Table,
    });
  };

  const tableModifyControls = (
    <>
      {!showRemoveConfirm ?
        <>
          {borderColor && borderColor !== '#00000000' ?
            <ControlsContainer dividerBottom>
              <ColorPicker
                setColor={color => {
                  setBorderColor(color);
                }}
                currentColor={borderColor}
                label={t('blocks.richTextTable.border')}
              />
              <button
                className="icon-button"
                onClick={() => setBorderColor('#0000000')}
              >
                <RedIcon />
              </button>
            </ControlsContainer>
          : <Button
              appearance="default"
              onClick={() => setBorderColor(DEFAULT_BORDER_COLOR)}
            >
              {t('blocks.richTextTable.addBorders')}
            </Button>
          }
          <Button
            color="red"
            appearance="ghost"
            onClick={() => setShowRemoveConfirm(true)}
          >
            {t('blocks.richTextTable.deleteTable')}
          </Button>
        </>
      : <ControlsContainer>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              removeTable();
              closeMenu();
              setShowRemoveConfirm(false);
            }}
          >
            {t('delete')}
          </Button>
          <Button
            appearance="default"
            onClick={() => setShowRemoveConfirm(false)}
          >
            {t('blocks.richTextTable.cancel')}
          </Button>
        </ControlsContainer>
      }
    </>
  );

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
      <ControlsWrapper>
        {WepublishEditor.isFormatActive(editor, BlockFormat.Table) ?
          tableModifyControls
        : tableInsertControls}
      </ControlsWrapper>
    </>
  );
}
