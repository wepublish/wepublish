import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  CommentRevisionInput,
  FullCommentFragment,
  getApiClientV2,
  TagType,
  useCommentQuery,
  useRatingSystemQuery,
  useUpdateCommentMutation,
} from '@wepublish/editor/api-v2';
import {
  CommentDeleteBtn,
  CommentHistory,
  CommentStateDropdown,
  CommentUser,
  createCheckedPermissionComponent,
  SelectTags,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdVisibility } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Checkbox,
  Col as RCol,
  FlexboxGrid,
  Form,
  Grid,
  IconButton,
  Message,
  Panel as RPanel,
  Row,
  Schema,
  SelectPicker,
  toaster,
} from 'rsuite';
import FormHelpText from 'rsuite/FormHelpText';

const ColNoMargin = styled(RCol)`
  margin-top: 0px;
`;

const FlexItem = styled(FlexboxGrid.Item)`
  margin-top: 10px;
`;

const showErrors = (error: ApolloError): void => {
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

/**
 * Helper function to parse comment revision input object out of full revision fragment.
 * @param comment
 */
export function getLastRevision(
  comment: FullCommentFragment
): CommentRevisionInput | undefined {
  const revisions = comment.revisions;
  if (!revisions.length) {
    return;
  }

  const lastRevision = revisions[revisions.length - 1];
  const parsedRevision = {
    title: lastRevision?.title,
    lead: lastRevision?.lead,
    text: lastRevision?.text,
  } as CommentRevisionInput;

  return parsedRevision;
}

/**
 * Check, if revision object differs from original. Used to decide, whether to create a new revision.
 */
function hasRevisionChanged(
  comment: FullCommentFragment | undefined,
  revision: CommentRevisionInput | undefined
): boolean {
  if (!comment) {
    return true;
  }

  const originalVersion = getLastRevision(comment);

  return JSON.stringify(originalVersion) !== JSON.stringify(revision);
}

const CommentEditView = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const commentId = id!;
  const closePath = '/comments';
  const validationModel = Schema.Model({});
  const [close, setClose] = useState<boolean>(false);
  // where the comment properties are handled
  const [comment, setComment] = useState<FullCommentFragment | undefined>(
    undefined
  );
  // where the revisions are handled
  const [revision, setRevision] = useState<CommentRevisionInput | undefined>(
    undefined
  );
  // where the tag list is handled
  const [selectedTags, setSelectedTags] = useState<string[] | null>(null);

  const client = getApiClientV2();
  const { data: commentData, loading: loadingComment } = useCommentQuery({
    client,
    variables: {
      id: commentId,
    },
    fetchPolicy: 'cache-and-network',
    onError: showErrors,
  });

  const { data: ratingSystem, loading: loadingRatingSystem } =
    useRatingSystemQuery({
      client,
      onError: showErrors,
    });

  const [updateCommentMutation, { loading: updatingComment }] =
    useUpdateCommentMutation({
      client,
      onCompleted: () =>
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={3000}
          >
            {t('comments.edit.success')}
          </Message>
        ),
      onError: showErrors,
    });

  // compute loading state
  const loading = updatingComment || loadingComment || loadingRatingSystem;

  /**
   * Initial set of variables "comment" and "revision"
   */
  useEffect(() => {
    const tmpComment = commentData?.comment;
    if (!tmpComment) {
      return;
    }
    setSelectedTags(null);
    setComment(tmpComment);

    const lastRevision = getLastRevision(tmpComment);
    setRevision(lastRevision);
  }, [commentData]);

  const commentTags = useMemo(
    () => selectedTags ?? comment?.tags?.map(tag => tag.id),
    [comment, selectedTags]
  );

  const ratingOverrides = useMemo(
    () =>
      ratingSystem?.ratingSystem.answers.map(answer => ({
        answerId: answer.id,
        name: answer.answer,
        value:
          comment?.overriddenRatings?.find(
            override => override.answerId === answer.id
          )?.value ?? null,
      })) ?? [],
    [comment, ratingSystem]
  );

  const ratingOverridePossibleValues = [
    { label: t('commentEditView.noOverride'), value: null },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
  ];

  async function updateComment() {
    if (!comment) {
      return;
    }

    await updateCommentMutation({
      variables: {
        id: comment.id,
        revision: hasRevisionChanged(comment, revision) ? revision : undefined,
        userID: comment.user?.id || null,
        guestUsername: comment.guestUsername,
        guestUserImageID: comment.guestUserImage?.id || null,
        source: comment.source,
        tagIds: commentTags,
        featured: comment.featured,
        ratingOverrides: comment.overriddenRatings,
      },
    });

    if (close) {
      navigate(closePath);
    }
  }

  return (
    <Form
      onSubmit={() => updateComment()}
      model={validationModel}
      fluid
      disabled={loading}
      style={{
        maxHeight: 'calc(100vh - 135px)',
        maxWidth: 'calc(100vw - 260px - 80px)',
      }}
    >
      <SingleViewTitle
        loading={loading}
        title={t('comments.edit.title')}
        loadingTitle={t('comments.edit.title')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setClose}
      />

      {/* form elements */}
      <Grid fluid>
        <Row gutter={30}>
          {/* comment content */}
          <RCol
            xs={14}
            style={{
              maxHeight: 'calc(100vh - 80px - 60px - 15px)',
              overflowY: 'scroll',
            }}
          >
            <RPanel
              bordered
              header={t('commentEditView.commentContextHeader')}
            >
              {comment && (
                <CommentHistory
                  commentItemID={comment.itemID}
                  commentItemType={comment.itemType}
                  originComment={comment}
                  revision={revision}
                  setRevision={setRevision}
                />
              )}
            </RPanel>
          </RCol>

          <RCol xs={10}>
            <Row>
              {/* some actions on the comment */}
              <ColNoMargin xs={24}>
                <RPanel
                  bordered
                  header={t('commentEditView.actions')}
                >
                  <FlexboxGrid>
                    <FlexboxGrid.Item
                      colspan={24}
                      style={{ textAlign: 'start' }}
                    >
                      <IconButton
                        appearance="ghost"
                        color="violet"
                        icon={<MdVisibility />}
                        onClick={() => {
                          navigate(`/articles/edit/${comment?.itemID}`);
                        }}
                      >
                        {t('commentEditView.goToArticle')}
                      </IconButton>
                    </FlexboxGrid.Item>

                    <FlexItem colspan={24}>
                      {comment && (
                        <CommentStateDropdown
                          comment={comment}
                          onStateChanged={async (state, rejectionReason) => {
                            setComment({
                              ...comment,
                              state,
                              rejectionReason,
                            });
                          }}
                        />
                      )}
                    </FlexItem>

                    <FlexItem colspan={24}>
                      <CommentDeleteBtn
                        comment={comment}
                        onCommentDeleted={() => {
                          navigate(closePath);
                        }}
                      />
                    </FlexItem>
                  </FlexboxGrid>
                </RPanel>
              </ColNoMargin>

              {/* tags & source */}
              <RCol xs={24}>
                <RPanel
                  bordered
                  header={t('commentEditView.variousPanelHeader')}
                >
                  <Row>
                    {/* featured comment (top comment) */}
                    {comment && (
                      <RCol xs={24}>
                        <Checkbox
                          checked={!!comment?.featured}
                          onChange={(value, checked) => {
                            setComment({
                              ...comment,
                              featured: checked,
                            });
                          }}
                        >
                          {t('commentEditView.featured')}
                        </Checkbox>
                        <FormHelpText>
                          {t('commentEditView.featuredHelpText')}
                        </FormHelpText>
                      </RCol>
                    )}

                    {/* tags */}
                    <RCol xs={24}>
                      <Form.ControlLabel>
                        {t('commentEditView.tags')}
                      </Form.ControlLabel>
                      <SelectTags
                        defaultTags={comment?.tags ?? []}
                        selectedTags={commentTags}
                        setSelectedTags={setSelectedTags}
                        tagType={TagType.Comment}
                      />
                    </RCol>

                    {/* external source */}
                    <RCol xs={24}>
                      <Form.ControlLabel>
                        {t('commentEditView.source')}
                      </Form.ControlLabel>
                      <Form.Control
                        name="externalSource"
                        placeholder={t('commentEditView.source')}
                        value={comment?.source || ''}
                        onChange={(source: string) => {
                          setComment(
                            oldComment =>
                              ({ ...oldComment, source }) as FullCommentFragment
                          );
                        }}
                      />
                    </RCol>
                  </Row>
                </RPanel>
              </RCol>

              {/* user or guest user */}
              <RCol xs={24}>
                <RPanel
                  bordered
                  header={t('commentEditView.userPanelHeader')}
                >
                  <CommentUser
                    comment={comment}
                    setComment={setComment}
                  />
                </RPanel>
              </RCol>

              {/* rating overrides */}
              <ColNoMargin xs={24}>
                <RPanel
                  bordered
                  header={t('commentEditView.ratingOverrides')}
                >
                  <FlexboxGrid>
                    {ratingOverrides.map(override => (
                      <FlexItem
                        key={override.answerId}
                        colspan={24}
                      >
                        <Form.ControlLabel>{override.name}</Form.ControlLabel>
                        <SelectPicker
                          block
                          cleanable={false}
                          data={ratingOverridePossibleValues}
                          value={override.value}
                          onChange={value =>
                            setComment(oldComment =>
                              oldComment ?
                                {
                                  ...oldComment,
                                  overriddenRatings: ratingOverrides.map(
                                    oldOverride =>
                                      (
                                        oldOverride.answerId ===
                                        override.answerId
                                      ) ?
                                        { answerId: override.answerId, value }
                                      : {
                                          answerId: oldOverride.answerId,
                                          value: oldOverride.value,
                                        }
                                  ),
                                }
                              : undefined
                            )
                          }
                        />
                      </FlexItem>
                    ))}
                  </FlexboxGrid>
                </RPanel>
              </ColNoMargin>
            </Row>
          </RCol>
        </Row>
      </Grid>
    </Form>
  );
});

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_UPDATE_COMMENTS',
  'CAN_TAKE_COMMENT_ACTION',
])(CommentEditView);
export { CheckedPermissionComponent as CommentEditView };
