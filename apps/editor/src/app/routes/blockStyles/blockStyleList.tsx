import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  BlockStyle,
  EditorBlockType,
  useBlockStylesQuery,
  useCreateBlockStyleMutation,
  useDeleteBlockStyleMutation,
  useUpdateBlockStyleMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  TableWrapper,
} from '@wepublish/ui/editor';
import { equals } from 'ramda';
import { memo, useCallback, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSave } from 'react-icons/md';
import {
  Button,
  CheckPicker,
  FlexboxGrid,
  Form,
  IconButton as RIconButton,
  Loader as RLoader,
  Message,
  Modal,
  toaster,
} from 'rsuite';

const FlexGridSmallerMargin = styled(FlexboxGrid)`
  margin-bottom: 12px;
  gap: 12px;
`;

const Content = styled.div`
  margin-top: 2rem;
  height: 100%;
`;

const IconButton = styled(RIconButton)`
  margin-left: 12px;
`;

const Flex = styled.div`
  flex: 0 0 auto;
`;

const FlexWrapper = styled.div`
  max-width: 300px;
  flex: 1 1;
`;

const Loader = styled(RLoader)`
  margin: 30px;
`;

enum BlockStyleListActionType {
  Set = 'set',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

type BlockStyleListActions =
  | { type: BlockStyleListActionType.Set; payload: Record<string, BlockStyle> }
  | { type: BlockStyleListActionType.Create; payload: BlockStyle }
  | {
      type: BlockStyleListActionType.Update;
      payload: BlockStyle;
    }
  | { type: BlockStyleListActionType.Delete; payload: { id: string } };

const mapBlockStyleToFormValue = (
  blockStyles: BlockStyle[] | null | undefined
) =>
  blockStyles?.reduce(
    (obj, node) => {
      obj[node.id] = node;

      return obj;
    },
    {} as Record<string, BlockStyle>
  ) ?? {};

const blockStyleFormValueReducer = (
  state: Record<string, BlockStyle>,
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

  const { loading } = useBlockStylesQuery({
    onError: showErrors,
    onCompleted(newData) {
      dispatchApiValue({
        type: BlockStyleListActionType.Set,
        payload: mapBlockStyleToFormValue(newData.blockStyles),
      });

      dispatchFormValue({
        type: BlockStyleListActionType.Set,
        payload: mapBlockStyleToFormValue(newData.blockStyles),
      });
    },
  });

  const [createBlockStyle] = useCreateBlockStyleMutation({
    variables: {
      blocks: [],
      name: '',
    },
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

  const [updateBlockStyle] = useUpdateBlockStyleMutation({
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

  const [deleteBlockStyle] = useDeleteBlockStyleMutation({
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
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_BLOCK_STYLE']}>
          <ListViewActions>
            <RIconButton
              type="button"
              appearance="primary"
              data-testid="create"
              icon={<MdAdd />}
              onClick={() => createBlockStyle()}
              disabled={hasEmptyStyle}
            >
              {t('blockStyles.createBlockStyle')}
            </RIconButton>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      {loading && (
        <FlexboxGrid justify="center">
          <Loader size="lg" />
        </FlexboxGrid>
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
                        type="submit"
                        circle
                        size="sm"
                        icon={<MdSave />}
                        onClick={() => {
                          updateBlockStyle({
                            variables: inputValue,
                          });
                        }}
                        disabled={!shouldUpdateBlockStyle(blockstyleId)}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_BLOCK_STYLE']}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        color="red"
                        appearance="ghost"
                        circle
                        size="sm"
                        icon={<MdDelete />}
                        onClick={() => setBlockStyleToDelete(blockstyleId)}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </Flex>
              </FlexGridSmallerMargin>
            </Form>
          ))}
        </Content>
      </TableWrapper>

      <Modal
        open={!!blockstyleToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setBlockStyleToDelete(null)}
      >
        <Modal.Title>{t('blockStyles.areYouSure')}</Modal.Title>
        <Modal.Body>
          {t('blockStyles.areYouSureBody', {
            blockStyle: formValue[blockstyleToDelete!]?.name,
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
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
            appearance="subtle"
            onClick={() => setBlockStyleToDelete(null)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_CREATE_BLOCK_STYLE',
  'CAN_UPDATE_BLOCK_STYLE',
  'CAN_DELETE_BLOCK_STYLE',
])(BlockStyleList);
export { CheckedPermissionComponent as BlockStyleList };
