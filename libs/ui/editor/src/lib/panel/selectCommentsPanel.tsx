import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  CommentBlockCommentFragment,
  FullCommentFragment,
  getApiClientV2,
  TagType,
  useCommentListLazyQuery,
} from '@wepublish/editor/api-v2';
import { TFunction } from 'i18next';
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Drawer,
  Form,
  IconButton,
  Message as RMessage,
  Pagination,
  Table,
  toaster,
  Toggle,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { IconButtonTooltip, PermissionControl, SelectTags } from '../atoms';
import { RichTextBlock } from '../blocks';
import { CommentBlockValue } from '../blocks/types';
import { DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES } from '../utility';

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

const Message = styled(RMessage)`
  margin-top: 12px;
`;

const FormGroupWrapper = styled.div`
  width: 250px;
`;

const DrawerBody = styled(Drawer.Body)`
  padding: 24px;
`;

const TableCellNoPadding = styled(Table.Cell)`
  padding: 0;
`;

const PermissionControlWrapper = styled(Table.Cell)`
  padding: 6px 0;
`;

const onErrorToast = (error: ApolloError) => {
  if (error?.message) {
    toaster.push(
      <RMessage
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error?.message}
      </RMessage>
    );
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
  const client = getApiClientV2();
  const [fetchComments, { data, loading }] = useCommentListLazyQuery({
    client,
    onError: onErrorToast,
    fetchPolicy: 'cache-and-network',
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
          []) as CommentBlockCommentFragment[]
      );
    } else {
      onSelect(
        { item: itemId, tags: tagFilter || [] },
        (data?.comments.nodes ?? []) as CommentBlockCommentFragment[]
      );
    }
  };

  useEffect(() => {
    itemId &&
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
      <Drawer.Header>
        <Drawer.Title>{t('blocks.comment.title')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'ghost'}
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>

          <Button
            appearance={'primary'}
            onClick={() => saveSelection()}
          >
            {t('saveAndClose')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <DrawerBody>
        <FormGroupWrapper>
          <Form.Group controlId="tags">
            <Form.ControlLabel>
              {t('blocks.comment.filterByTag')}
            </Form.ControlLabel>

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
          <Message
            showIcon
            type="info"
          >
            {t('blocks.comment.commentsFilterByTagInformation')}
          </Message>
        )}

        <ToggleWrapper>
          <Toggle
            defaultChecked={allowCherryPicking}
            onChange={toggleCherryPicking}
          />
          {t('blocks.comment.cherryPick')}
        </ToggleWrapper>

        <Table
          minHeight={600}
          autoHeight
          loading={loading}
          data={data?.comments?.nodes || []}
          rowClassName={rowData =>
            commentFilter?.includes(rowData?.id) ? 'highlighted-row' : ''
          }
        >
          {allowCherryPicking && (
            <Table.Column width={36}>
              <Table.HeaderCell>{''}</Table.HeaderCell>
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
            </Table.Column>
          )}

          <Table.Column
            width={250}
            resizable
          >
            <Table.HeaderCell>
              {t('blocks.comment.displayName')}
            </Table.HeaderCell>
            <Table.Cell>
              {(rowData: RowDataType<CommentBlockCommentFragment>) =>
                getUsername(rowData as CommentBlockCommentFragment)
              }
            </Table.Cell>
          </Table.Column>

          <Table.Column
            width={350}
            align="left"
            resizable
          >
            <Table.HeaderCell>{t('comments.overview.text')}</Table.HeaderCell>
            <Table.Cell dataKey="revisions">
              {(rowData: RowDataType<FullCommentFragment>) => (
                <>
                  {rowData?.revisions?.length ?
                    <RichTextBlock
                      displayOnly
                      displayOneLine
                      disabled
                      // TODO: remove this
                      onChange={console.log}
                      value={
                        rowData?.revisions[rowData?.revisions?.length - 1]
                          ?.text || []
                      }
                    />
                  : null}
                </>
              )}
            </Table.Cell>
          </Table.Column>

          <Table.Column
            width={150}
            align="center"
            fixed="right"
          >
            <Table.HeaderCell>{t('comments.overview.edit')}</Table.HeaderCell>
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
                        icon={<MdEdit />}
                        circle
                        size="sm"
                      />
                    </Link>
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </PermissionControlWrapper>
          </Table.Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager']}
          total={data?.comments?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </DrawerBody>
    </>
  );
}
