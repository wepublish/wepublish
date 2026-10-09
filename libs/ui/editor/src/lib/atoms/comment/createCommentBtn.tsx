import { useMutation } from '@apollo/client/react';
import {
  Button,
  ButtonProps,
  IconButton,
  IconButtonProps,
} from '@mui/material';
import { CommentItemType, CreateCommentDocument } from '@wepublish/editor/api';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import { MdReply } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';
import { IconButtonTooltip } from '../iconButtonTooltip';

interface ReplyCommentBtnProps {
  size?: IconButtonProps['size'];
  color?: IconButtonProps['color'];
  variant?: ButtonProps['variant'];
  text?: string;
  itemID: string;
  itemType: CommentItemType;
  parentID?: string | null;
  icon?: React.ReactElement<IconType>;
  onCommentCreated?: () => void;
}

export function CreateCommentBtn({
  size,
  color,
  variant = 'outlined',
  text,
  itemID,
  itemType,
  parentID,
  icon,
  onCommentCreated,
}: ReplyCommentBtnProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onError = (error: Error) => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  const [createComment] = useMutation(CreateCommentDocument, {
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
          aria-label={t('replyCommentBtn.tooltip')}
          size={size}
          color={color}
          onClick={async () => {
            await createNewComment();
          }}
        >
          {icon || <MdReply />}
        </IconButton>
      );
    }
    return (
      <Button
        startIcon={icon || <MdReply />}
        style={{ marginLeft: '10px' }}
        size={size}
        color={color === 'default' ? undefined : color}
        variant={variant}
        onClick={async () => {
          await createNewComment();
        }}
      >
        {text}
      </Button>
    );
  }

  return (
    <IconButtonTooltip caption={t('replyCommentBtn.tooltip')}>
      {getIconBtn()}
    </IconButtonTooltip>
  );
}
