import { ApolloError } from '@apollo/client';
import {
  CommentItemType,
  useCreateCommentMutation,
} from '@wepublish/editor/api';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import { MdReply } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { IconButton, Message, toaster } from 'rsuite';
import { TypeAttributes } from 'rsuite/cjs/@types/common';

import { IconButtonTooltip } from '../iconButtonTooltip';

interface ReplyCommentBtnProps {
  circle?: boolean;
  size?: TypeAttributes.Size;
  color?: TypeAttributes.Color;
  appearance?: TypeAttributes.Appearance;
  text?: string;
  itemID: string;
  itemType: CommentItemType;
  parentID?: string | null;
  icon?: React.ReactElement<IconType>;
  onCommentCreated?: () => void;
}

export function CreateCommentBtn({
  circle,
  size,
  color,
  appearance,
  text,
  itemID,
  itemType,
  parentID,
  icon,
  onCommentCreated,
}: ReplyCommentBtnProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onError = (error: ApolloError) => {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error.message}
      </Message>
    );
  };

  const [createComment] = useCreateCommentMutation({
    onError,
  });

  async function createNewComment() {
    await createComment({
      variables: {
        itemID,
        itemType,
        parentID,
      },
      onCompleted: data => {
        navigate(`/comments/edit/${data?.createComment.id}`);
        if (onCommentCreated) {
          onCommentCreated();
        }
      },
    });
  }

  function getIconBtn() {
    if (!text) {
      return (
        <IconButton
          style={{ marginLeft: '10px' }}
          icon={icon || <MdReply />}
          size={size}
          circle={circle}
          color={color}
          appearance={appearance}
          onClick={async () => {
            await createNewComment();
          }}
        />
      );
    }
    return (
      <IconButton
        style={{ marginLeft: '10px' }}
        icon={icon || <MdReply />}
        size={size}
        circle={circle}
        color={color}
        appearance={appearance}
        onClick={async () => {
          await createNewComment();
        }}
      >
        {text}
      </IconButton>
    );
  }

  return (
    <IconButtonTooltip caption={t('replyCommentBtn.tooltip')}>
      {getIconBtn()}
    </IconButtonTooltip>
  );
}
