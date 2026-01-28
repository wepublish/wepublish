import 'emoji-mart/css/emoji-mart.css';

import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { BaseEmoji, Picker } from 'emoji-mart';
import { useContext } from 'react';
import { MdClose } from 'react-icons/md';
import { Col as RCol, IconButton, Row } from 'rsuite';

import { SubMenuContext } from './toolbar';

interface EmojiPickerProps {
  setEmoji: (emoji: string) => void;
}

const Col = styled(RCol)`
  text-align: right;
  margin-top: 0px;
  margin-bottom: 10px;
`;

export function EmojiPicker({ setEmoji }: EmojiPickerProps) {
  const { closeMenu } = useContext(SubMenuContext);

  return (
    <>
      <Global
        styles={css`
          .emoji-mart-bar:last-child {
            display: none;
          }
          .emoji-mart-scroll {
            overflow-y: scroll;
            overflow-x: hidden;
            height: 12em;
            padding: 0 6px 6px 6px;
            will-change: transform;
          }
        `}
      />
      <Row>
        <Col xs={24}>
          <IconButton
            icon={<MdClose />}
            onClick={() => closeMenu()}
          />
        </Col>
      </Row>
      <Picker
        onSelect={({ native }: BaseEmoji) => {
          closeMenu();
          setEmoji(native);
        }}
      />
    </>
  );
}
