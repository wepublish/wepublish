import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Grid as MuiGrid,
} from '@mui/material';
import {
  CommentDocument,
  CommentRevisionInput,
  FullCommentFragment,
  RatingSystemDocument,
  TagType,
  UpdateCommentDocument,
} from '@wepublish/editor/api';
import {
  CommentDeleteBtn,
  CommentHistory,
  CommentStateDropdown,
  CommentUser,
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  InfoTooltip,
  SelectTags,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdVisibility } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { Checkbox, Form, Schema, SelectPicker } from 'rsuite';
import Text from 'rsuite/Text';

import { commentItemLink } from './commentItemLink';

const ColNoMargin = styled(MuiGrid)`
  margin-top: 0px;
`;

const FlexItem = styled(MuiGrid)`
  margin-top: 12px;
`;

const showErrors = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
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

  const {
    data: commentData,
    loading: loadingComment,
    error: commentError,
  } = useQuery(CommentDocument, {
    variables: {
      id: commentId,
    },
  });

  const {
    data: ratingSystem,
    loading: loadingRatingSystem,
    error: ratingSystemError,
  } = useQuery(RatingSystemDocument);

  useEffect(() => {
    if (commentError) {
      showErrors(commentError);
    }
  }, [commentError]);

  useEffect(() => {
    if (ratingSystemError) {
      showErrors(ratingSystemError);
    }
  }, [ratingSystemError]);

  const [updateCommentMutation, { loading: updatingComment }] = useMutation(
    UpdateCommentDocument,
    {
      onCompleted: () =>
        enqueueSnackbar(t('comments.edit.success'), {
          variant: 'success',
          autoHideDuration: 3000,
        }),
      onError: showErrors,
    }
  );

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

  const itemLink = comment && commentItemLink(comment.itemType, comment.itemID);

  return (
    <Form
      onSubmit={() => updateComment()}
      model={validationModel}
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
      <Grid
        container
        spacing={2}
      >
        <Grid
          container
          spacing={2}
        >
          {/* comment content */}
          <Grid
            size={{ xs: 7 }}
            style={{
              maxHeight: 'calc(100vh - 80px - 60px - 15px)',
              overflowY: 'scroll',
            }}
          >
            <Card variant="outlined">
              <CardHeader title={t('commentEditView.commentContextHeader')} />

              <CardContent>
                {comment && (
                  <CommentHistory
                    commentItemID={comment.itemID}
                    commentItemType={comment.itemType}
                    originComment={comment}
                    revision={revision}
                    setRevision={setRevision}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 5 }}>
            <Grid
              container
              spacing={2}
            >
              {/* some actions on the comment */}
              <ColNoMargin size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardHeader title={t('commentEditView.actions')} />

                  <CardContent>
                    <Grid
                      container
                      spacing={2}
                    >
                      <Grid
                        size={{ xs: 12 }}
                        style={{ textAlign: 'start' }}
                      >
                        <Button
                          variant="outlined"
                          startIcon={<MdVisibility />}
                          color="secondary"
                          onClick={() => {
                            if (itemLink) {
                              navigate(itemLink.path);
                            }
                          }}
                        >
                          {t(
                            itemLink?.labelKey ?? 'commentEditView.goToArticle'
                          )}
                        </Button>
                      </Grid>

                      <FlexItem size={{ xs: 12 }}>
                        {comment && (
                          <CommentStateDropdown
                            comment={comment}
                            onStateChanged={async (state, rejectionReason) => {
                              setComment({
                                ...comment,
                                state,
                                rejectionReason: rejectionReason ?? null,
                              });
                            }}
                          />
                        )}
                      </FlexItem>

                      <FlexItem size={{ xs: 12 }}>
                        <CommentDeleteBtn
                          comment={comment}
                          onCommentDeleted={() => {
                            navigate(closePath);
                          }}
                        />
                      </FlexItem>
                    </Grid>
                  </CardContent>
                </Card>
              </ColNoMargin>

              {/* tags & source */}
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardHeader title={t('commentEditView.variousPanelHeader')} />

                  <CardContent>
                    <Grid
                      container
                      spacing={2}
                    >
                      {/* featured comment (top comment) */}
                      {comment && (
                        <Grid size={{ xs: 12 }}>
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

                          <Text>{t('commentEditView.featuredHelpText')}</Text>
                        </Grid>
                      )}

                      {/* tags */}
                      <Grid size={{ xs: 12 }}>
                        <Form.Label>{t('commentEditView.tags')}</Form.Label>
                        <SelectTags
                          defaultTags={comment?.tags ?? []}
                          selectedTags={commentTags}
                          setSelectedTags={setSelectedTags}
                          tagType={TagType.Comment}
                        />
                      </Grid>

                      {/* external source */}
                      <Grid size={{ xs: 12 }}>
                        <Form.Label>
                          {t('commentEditView.source')}{' '}
                          <InfoTooltip text={t('commentEditView.sourceInfo')} />
                        </Form.Label>
                        <Form.Control
                          name="externalSource"
                          placeholder={t('commentEditView.source')}
                          value={comment?.source || ''}
                          onChange={(source: string) => {
                            setComment(
                              oldComment =>
                                ({
                                  ...oldComment,
                                  source,
                                }) as FullCommentFragment
                            );
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* user or guest user */}
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardHeader title={t('commentEditView.userPanelHeader')} />

                  <CardContent>
                    <CommentUser
                      comment={comment}
                      setComment={setComment}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* rating overrides */}
              <ColNoMargin size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardHeader
                    title={
                      <>
                        {t('commentEditView.ratingOverrides')}{' '}
                        <InfoTooltip
                          text={t('commentEditView.ratingOverridesInfo')}
                        />
                      </>
                    }
                  />

                  <CardContent>
                    <Grid
                      container
                      spacing={2}
                    >
                      {ratingOverrides.map(override => (
                        <FlexItem
                          size={{ xs: 12 }}
                          key={override.answerId}
                        >
                          <Form.Label>{override.name}</Form.Label>
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
                                          {
                                            __typename: 'OverriddenRating',
                                            answerId: override.answerId,
                                            value,
                                          }
                                        : {
                                            __typename: 'OverriddenRating',
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
                    </Grid>
                  </CardContent>
                </Card>
              </ColNoMargin>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Form>
  );
});

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_UPDATE_COMMENTS',
  'CAN_TAKE_COMMENT_ACTION',
])(CommentEditView);
export { CheckedPermissionComponent as CommentEditView };
