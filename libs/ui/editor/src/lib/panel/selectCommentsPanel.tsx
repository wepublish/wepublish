import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Switch,
} from '@mui/material';
import {
  CommentBlockCommentFragment,
  CommentListDocument,
  FullCommentFragment,
  TagType,
} from '@wepublish/editor/api';
import { CanUpdateComments } from '@wepublish/permissions';
import { toPlaintext } from '@wepublish/richtext';
import { TFunction } from 'i18next';
import { useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { IconButtonTooltip, PermissionControl, SelectTags } from '../atoms';
import { InfoTooltip } from '../atoms/infoTooltip';
import { CommentBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { DataTable } from '../listView/data-table';
import { Pagination } from '../listView/pagination';

const ToggleWrapper = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  margin-top: 48px;
`;

const FormGroupWrapper = styled.div`
  width: 250px;
`;

const commentUsernameGenerator =
  (t: TFunction<'translation'>) => (comment: CommentBlockCommentFragment) =>
    comment?.user ?
      `${comment?.user.name}`
    : ` ${comment?.guestUsername} ${t('comments.panels.unregisteredUser')}`;

export type SelectCommentPanelProps = {
  itemId: string | null | undefined;
  selectedFilter: CommentBlockValue['filter'];
  onClose(): void;
  onSelect(
    filter: CommentBlockValue['filter'],
    comments: CommentBlockCommentFragment[]
  ): void;
};

export function SelectCommentPanel({
  itemId,
  selectedFilter,
  onClose,
  onSelect,
}: SelectCommentPanelProps) {
  const [tagFilter, setTagFilter] = useState(selectedFilter.tags);
  const [commentFilter, setCommentFilter] = useState(selectedFilter.comments);
  const [allowCherryPicking, toggleCherryPicking] = useReducer(
    cherryPicking => !cherryPicking,
    !!commentFilter?.length
  );
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const { t } = useTranslation();

  const { data, loading } = useQuery(CommentListDocument, {
    skip: !itemId,
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      filter: {
        item: itemId,
        tags: tagFilter,
      },
    },
  });

  const getUsername = useMemo(() => commentUsernameGenerator(t), [t]);

  const saveSelection = () => {
    if (allowCherryPicking) {
      onSelect(
        {
          item: itemId,
          comments: commentFilter || [],
        },
        (data?.comments.nodes.filter(({ id }) => commentFilter?.includes(id)) ??
          []) as unknown as CommentBlockCommentFragment[]
      );
    } else {
      onSelect(
        { item: itemId, tags: tagFilter || [] },
        (data?.comments.nodes ?? []) as unknown as CommentBlockCommentFragment[]
      );
    }
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('blocks.comment.title')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="outlined"
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>

          <Button
            variant="contained"
            onClick={() => saveSelection()}
          >
            {t('saveAndClose')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <FormGroupWrapper>
          <FormControl
            fullWidth
            sx={{ marginBottom: 3 }}
          >
            <FormLabel>{t('blocks.comment.filterByTag')}</FormLabel>

            <SelectTags
              defaultTags={[]}
              name="tags"
              tagType={TagType.Comment}
              setSelectedTags={setTagFilter}
              selectedTags={tagFilter}
            />
          </FormControl>
        </FormGroupWrapper>

        {!allowCherryPicking && !!tagFilter?.length && (
          <Alert severity="info">
            {t('blocks.comment.commentsFilterByTagInformation')}
          </Alert>
        )}

        <ToggleWrapper>
          <FormControlLabel
            control={
              <Switch
                defaultChecked={allowCherryPicking}
                onChange={() => toggleCherryPicking()}
              />
            }
            label={
              <>
                {t('blocks.comment.cherryPick')}{' '}
                <InfoTooltip text={t('blocks.comment.cherryPickInfo')} />
              </>
            }
          />
        </ToggleWrapper>

        <DataTable
          loading={loading}
          data={data?.comments?.nodes ?? []}
          getRowId={row => row.id}
          rowClassName={row =>
            commentFilter?.includes(row.id) ? 'highlighted-row' : ''
          }
          columns={[
            ...(allowCherryPicking ?
              [
                {
                  id: 'select',
                  label: '',
                  width: 48,
                  render: (row: FullCommentFragment) => (
                    <Checkbox
                      size="small"
                      checked={commentFilter?.includes(row.id) ?? false}
                      onChange={(_event, shouldInclude) =>
                        setCommentFilter(old =>
                          shouldInclude ?
                            [...(old ?? []), row.id]
                          : old?.filter(id => id !== row.id)
                        )
                      }
                    />
                  ),
                },
              ]
            : []),
            {
              id: 'displayName',
              label: t('blocks.comment.displayName'),
              width: 250,
              render: row =>
                getUsername(row as unknown as CommentBlockCommentFragment),
            },
            {
              id: 'revisions',
              label: t('comments.overview.text'),
              width: 350,
              render: row =>
                row?.revisions?.length ?
                  toPlaintext(
                    row.revisions[row.revisions.length - 1]?.text?.content
                  )
                : null,
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: row => (
                <PermissionControl
                  qualifyingPermissions={[CanUpdateComments.id]}
                >
                  <IconButtonTooltip caption={t('comments.overview.edit')}>
                    <IconButton
                      component={RouterLink}
                      target="_blank"
                      to={`/comments/edit/${row.id}`}
                      aria-label={t('comments.overview.edit')}
                      size="small"
                    >
                      <MdEdit />
                    </IconButton>
                  </IconButtonTooltip>
                </PermissionControl>
              ),
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit,
          }}
          totalCount={data?.comments?.totalCount ?? 0}
        />
      </DrawerBody>
    </>
  );
}
