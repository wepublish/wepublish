import { useLazyQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  FormControlLabel,
  IconButton,
  Switch,
} from '@mui/material';
import {
  CommentBlockCommentFragment,
  CommentListDocument,
  FullCommentFragment,
  TagType,
} from '@wepublish/editor/api';
import { toPlaintext } from '@wepublish/richtext';
import { TFunction } from 'i18next';
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Checkbox, Form, Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { IconButtonTooltip, PermissionControl, SelectTags } from '../atoms';
import { InfoTooltip } from '../atoms/infoTooltip';
import { CommentBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { humanizeError } from '../humanizeError';
import { Table } from '../listView/list-view';
import { Pagination } from '../listView/pagination';
import { enqueueSnackbar } from '../snackbar';

const CheckboxWrapper = styled.div`
  height: 46px;
  display: flex;
  align-items: center;
`;

const ToggleWrapper = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  margin-top: 48px;
`;

const FormGroupWrapper = styled.div`
  width: 250px;
`;

const TableCellNoPadding = styled(RTable.Cell)`
  padding: 0;
`;

const PermissionControlWrapper = styled(RTable.Cell)`
  padding: 6px 0;
`;

const onErrorToast = (error: Error) => {
  if (error?.message) {
    enqueueSnackbar(error && humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  }
};

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

  const [fetchComments, { data, loading, error: commentListError }] =
    useLazyQuery(CommentListDocument);

  useEffect(() => {
    if (commentListError) {
      onErrorToast(commentListError);
    }
  }, [commentListError]);

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

  useEffect(() => {
    if (!itemId) {
      return;
    }

    fetchComments({
      variables: {
        take: limit,
        skip: (page - 1) * limit,
        filter: {
          item: itemId,
          tags: tagFilter,
        },
      },
    });
  }, [page, limit, tagFilter, fetchComments, itemId]);

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
          <Form.Group controlId="tags">
            <Form.Label>{t('blocks.comment.filterByTag')}</Form.Label>

            <SelectTags
              defaultTags={[]}
              name="tags"
              tagType={TagType.Comment}
              setSelectedTags={setTagFilter}
              selectedTags={tagFilter}
            />
          </Form.Group>
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

        <Table
          autoHeight
          loading={loading}
          data={data?.comments?.nodes || []}
          rowClassName={(rowData: any) =>
            commentFilter?.includes(rowData?.id) ? 'highlighted-row' : ''
          }
        >
          {allowCherryPicking && (
            <RTable.Column width={36}>
              <RTable.HeaderCell>{''}</RTable.HeaderCell>
              <TableCellNoPadding>
                {(rowData: RowDataType<CommentBlockCommentFragment>) => (
                  <CheckboxWrapper>
                    <Checkbox
                      defaultChecked={
                        commentFilter?.includes(rowData.id) ?? false
                      }
                      checked={commentFilter?.includes(rowData.id) ?? false}
                      value={commentFilter?.includes(rowData.id) ? 0 : 1}
                      onChange={shouldInclude =>
                        setCommentFilter(old =>
                          shouldInclude ?
                            [...(old ?? []), rowData.id]
                          : old?.filter(id => id !== rowData.id)
                        )
                      }
                    />
                  </CheckboxWrapper>
                )}
              </TableCellNoPadding>
            </RTable.Column>
          )}

          <RTable.Column
            width={250}
            resizable
          >
            <RTable.HeaderCell>
              {t('blocks.comment.displayName')}
            </RTable.HeaderCell>
            <RTable.Cell>
              {(rowData: RowDataType<CommentBlockCommentFragment>) =>
                getUsername(rowData as CommentBlockCommentFragment)
              }
            </RTable.Cell>
          </RTable.Column>

          <RTable.Column
            width={350}
            align="left"
            resizable
          >
            <RTable.HeaderCell>{t('comments.overview.text')}</RTable.HeaderCell>
            <RTable.Cell dataKey="revisions">
              {(rowData: RowDataType<FullCommentFragment>) =>
                rowData?.revisions?.length ?
                  toPlaintext(
                    rowData?.revisions[rowData?.revisions?.length - 1]?.text
                      .content
                  )
                : null
              }
            </RTable.Cell>
          </RTable.Column>

          <RTable.Column
            width={100}
            align="center"
            fixed="right"
          >
            <RTable.HeaderCell align="center">{t('action')}</RTable.HeaderCell>
            <PermissionControlWrapper>
              {(rowData: RowDataType<FullCommentFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_UPDATE_COMMENTS']}
                >
                  <IconButtonTooltip caption={t('comments.overview.edit')}>
                    <Link
                      target="_blank"
                      to={`/comments/edit/${rowData.id}`}
                    >
                      <IconButton
                        aria-label={t('comments.overview.edit')}
                        size="small"
                      >
                        <MdEdit />
                      </IconButton>
                    </Link>
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </PermissionControlWrapper>
          </RTable.Column>
        </Table>

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
