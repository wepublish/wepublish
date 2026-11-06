import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { CommentDocument } from '@wepublish/editor/api';
import {
  CommentDeleteBtn,
  CommentStateDropdown,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdVisibility } from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { commentItemLink } from './commentItemLink';

const Actions = styled.div`
  display: grid;
  justify-items: start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export function CommentActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { data, refetch } = useQuery(CommentDocument, { variables: { id } });

  if (data === undefined) {
    return null;
  }

  const comment = data.comment;
  const itemLink = commentItemLink(comment.itemType, comment.itemID);

  return (
    <Actions>
      <Button
        component={Link}
        to={itemLink.path}
        variant="outlined"
        color="secondary"
        startIcon={<MdVisibility />}
      >
        {t(itemLink.labelKey)}
      </Button>

      <CommentStateDropdown
        comment={comment}
        onStateChanged={() => refetch()}
      />

      <CommentDeleteBtn
        comment={comment}
        onCommentDeleted={() => navigate('/comments')}
      />
    </Actions>
  );
}
