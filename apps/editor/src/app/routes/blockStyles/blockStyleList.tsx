import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import {
  BlockStylesDocument,
  CreateBlockStyleDocument,
  DeleteBlockStyleDocument,
  EditorBlockType,
  FullBlockStyleFragment,
  UpdateBlockStyleDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  TableWrapper,
} from '@wepublish/ui/editor';
import { equals } from 'ramda';
import { memo, useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSave } from 'react-icons/md';
import { CheckPicker, Form } from 'rsuite';

const FlexGridSmallerMargin = styled(Stack)`
  margin-bottom: 12px;
  width: 100%;
  gap: 12px;
  flex-wrap: wrap;
`;

const Content = styled.div`
  height: 100%;
`;

const Flex = styled.div`
  flex: 0 0 auto;
`;

const FlexWrapper = styled.div`
  max-width: 300px;
  flex: 1 1;
`;

const Loader = styled(CircularProgress)`
  margin: 32px;
`;

enum BlockStyleListActionType {
  Set = 'set',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

type BlockStyleListActions =
  | {
      type: BlockStyleListActionType.Set;
      payload: Record<string, FullBlockStyleFragment>;
    }
  | { type: BlockStyleListActionType.Create; payload: FullBlockStyleFragment }
  | {
      type: BlockStyleListActionType.Update;
      payload: FullBlockStyleFragment;
    }
  | { type: BlockStyleListActionType.Delete; payload: { id: string } };

const mapBlockStyleToFormValue = (
  blockStyles: FullBlockStyleFragment[] | null | undefined
) =>
  blockStyles?.reduce(
    (obj, node) => {
      obj[node.id] = node;

      return obj;
    },
    {} as Record<string, FullBlockStyleFragment>
  ) ?? {};

const blockStyleFormValueReducer = (
  state: Record<string, FullBlockStyleFragment>,
  action: BlockStyleListActions
): typeof state => {
  switch (action.type) {
    case BlockStyleListActionType.Set:
      return action.payload;

    case BlockStyleListActionType.Create:
      return {
        [action.payload.id]: action.payload,
        ...state,
      };

    case BlockStyleListActionType.Update: {
      const newState = { ...state };
      newState[action.payload.id] = action.payload;

      return newState;
    }

    case BlockStyleListActionType.Delete: {
      const newState = { ...state };
      delete newState[action.payload.id];

      return newState;
    }
  }

  return state;
};

const showErrors = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const BlockStyleList = memo(() => {
  const { t } = useTranslation();
  const [formValue, dispatchFormValue] = useReducer(
    blockStyleFormValueReducer,
    {}
  );
  const [apiValue, dispatchApiValue] = useReducer(
    blockStyleFormValueReducer,
    {}
  );
  const [blockstyleToDelete, setBlockStyleToDelete] = useState<string | null>(
    null
  );

  const hasEmptyStyle = Object.values(apiValue).some(style => !style.name);

  const { loading, data, error } = useQuery(BlockStylesDocument);

  useEffect(() => {
    if (error) {
      showErrors(error);
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      dispatchApiValue({
        type: BlockStyleListActionType.Set,
        payload: mapBlockStyleToFormValue(data.blockStyles),
      });

      dispatchFormValue({
        type: BlockStyleListActionType.Set,
        payload: mapBlockStyleToFormValue(data.blockStyles),
      });
    }
  }, [data]);

  const [createBlockStyle] = useMutation(CreateBlockStyleDocument, {
    onError: showErrors,
    onCompleted(createdBlockStyle) {
      if (!createdBlockStyle.createBlockStyle) {
        return;
      }

      dispatchApiValue({
        type: BlockStyleListActionType.Create,
        payload: createdBlockStyle.createBlockStyle,
      });

      dispatchFormValue({
        type: BlockStyleListActionType.Create,
        payload: createdBlockStyle.createBlockStyle,
      });
    },
  });

  const [updateBlockStyle] = useMutation(UpdateBlockStyleDocument, {
    onError: showErrors,
    onCompleted(updatedBlockStyle) {
      if (!updatedBlockStyle.updateBlockStyle) {
        return;
      }

      dispatchApiValue({
        type: BlockStyleListActionType.Update,
        payload: updatedBlockStyle.updateBlockStyle,
      });

      dispatchFormValue({
        type: BlockStyleListActionType.Update,
        payload: updatedBlockStyle.updateBlockStyle,
      });
    },
  });

  const [deleteBlockStyle] = useMutation(DeleteBlockStyleDocument, {
    onError: showErrors,
    onCompleted(deletedBlockStyle) {
      if (!deletedBlockStyle.deleteBlockStyle) {
        return;
      }

      dispatchApiValue({
        type: BlockStyleListActionType.Delete,
        payload: {
          id: deletedBlockStyle.deleteBlockStyle.id,
        },
      });

      dispatchFormValue({
        type: BlockStyleListActionType.Delete,
        payload: {
          id: deletedBlockStyle.deleteBlockStyle.id,
        },
      });
    },
  });

  const shouldUpdateBlockStyle = useCallback(
    (id: string) => {
      const apiBlockStyle = apiValue[id];
      const formBlockStyle = formValue[id];

      return !equals(apiBlockStyle, formBlockStyle);
    },
    [apiValue, formValue]
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('blockStyles.title')}</h2>
          <InfoTooltip text={t('blockStyles.info')} />
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_BLOCK_STYLE']}>
          <ListViewActions>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              type="button"
              data-testid="create"
              onClick={() =>
                createBlockStyle({
                  variables: {
                    blocks: [],
                    name: '',
                  },
                })
              }
              disabled={hasEmptyStyle}
            >
              {t('blockStyles.createBlockStyle')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      {loading && (
        <Stack
          direction="row"
          sx={{ justifyContent: 'center' }}
        >
          <CircularProgress size={40} />
        </Stack>
      )}

      <TableWrapper>
        <Content>
          {Object.entries(formValue).map(([blockstyleId, inputValue]) => (
            <Form key={blockstyleId}>
              <FlexGridSmallerMargin>
                <FlexWrapper>
                  <Form.Control
                    name={`name:${blockstyleId}`}
                    value={inputValue.name}
                    placeholder={t('blockStyles.placeholder')}
                    onChange={(value: string) => {
                      dispatchFormValue({
                        type: BlockStyleListActionType.Update,
                        payload: {
                          ...inputValue,
                          name: value,
                        },
                      });
                    }}
                  />
                </FlexWrapper>

                <FlexWrapper>
                  <CheckPicker
                    name={`blocks:${blockstyleId}`}
                    block
                    placeholder={t('blockStyles.blockTypesPlaceholder')}
                    value={inputValue.blocks}
                    data={Object.values(EditorBlockType).map(blockType => ({
                      value: blockType,
                      label: blockType,
                    }))}
                    onChange={blocks => {
                      dispatchFormValue({
                        type: BlockStyleListActionType.Update,
                        payload: {
                          ...inputValue,
                          blocks,
                        },
                      });
                    }}
                    placement={'auto'}
                  />
                </FlexWrapper>

                <Flex>
                  <PermissionControl
                    qualifyingPermissions={['CAN_UPDATE_BLOCK_STYLE']}
                  >
                    <IconButtonTooltip caption={t('save')}>
                      <IconButton
                        aria-label={t('save')}
                        type="submit"
                        size="small"
                        onClick={() => {
                          updateBlockStyle({
                            variables: inputValue,
                          });
                        }}
                        disabled={!shouldUpdateBlockStyle(blockstyleId)}
                      >
                        <MdSave />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_BLOCK_STYLE']}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        color="error"
                        size="small"
                        onClick={() => setBlockStyleToDelete(blockstyleId)}
                      >
                        <MdDelete />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                </Flex>
              </FlexGridSmallerMargin>
            </Form>
          ))}
        </Content>
      </TableWrapper>

      <Dialog
        fullWidth
        open={!!blockstyleToDelete}
        maxWidth="xs"
        onClose={() => setBlockStyleToDelete(null)}
      >
        <DialogTitle>{t('blockStyles.areYouSure')}</DialogTitle>
        <DialogContent>
          {t('blockStyles.areYouSureBody', {
            blockStyle: formValue[blockstyleToDelete!]?.name,
          })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              deleteBlockStyle({
                variables: {
                  id: blockstyleToDelete!,
                },
              });
              setBlockStyleToDelete(null);
            }}
          >
            {t('blockStyles.areYouSureConfirmation')}
          </Button>

          <Button
            variant="text"
            onClick={() => setBlockStyleToDelete(null)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_CREATE_BLOCK_STYLE',
  'CAN_UPDATE_BLOCK_STYLE',
  'CAN_DELETE_BLOCK_STYLE',
])(BlockStyleList);
export { CheckedPermissionComponent as BlockStyleList };
