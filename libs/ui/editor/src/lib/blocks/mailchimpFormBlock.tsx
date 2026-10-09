import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card as MuiCard,
  CardContent,
  CardHeader,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Switch,
} from '@mui/material';
import {
  MailchimpFormOptionsLayout,
  MailchimpInterestGroupsDocument,
  MailchimpListsDocument,
  MailchimpMergeFieldsDocument,
  SyncProviderSettingsDocument,
} from '@wepublish/editor/api';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAddCircle,
  MdArrowDownward,
  MdArrowUpward,
  MdDelete,
} from 'react-icons/md';
import { Input, InputPicker, SelectPicker, TagPicker } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { ChooseEditImage } from '../atoms/chooseEditImage';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { InfoTooltip } from '../atoms/infoTooltip';
import { DRAWER_WIDTHS } from '../drawer';
import { useRegisterValidator } from '../hooks/useEditorValidation';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import {
  MailchimpFormBlockValue,
  MailchimpFormFieldConfigValue,
  MailchimpFormInterestOptionValue,
  MailchimpFormStepValue,
  MailchimpFormSuccessOptionValue,
} from './types';

const Panel = styled(MuiCard)`
  background-color: var(--rs-bg-well);
  margin-bottom: 12px;

  .rs-panel-body {
    display: grid;
    gap: 12px;
  }
`;

const Heading = styled('p')`
  margin: 0;
  font-weight: 600;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Field = styled.div`
  display: grid;
  gap: 4px;
`;

const Label = styled('label')`
  font-size: 12px;
  color: var(--rs-text-secondary);
`;

const HelpText = styled('small')`
  font-size: 11px;
  color: var(--rs-text-secondary);
`;

const ErrorText = styled('small')`
  font-size: 11px;
  color: var(--rs-text-error);
`;

const ItemPanel = styled(MuiCard)`
  background-color: var(--rs-bg-card);
  border: 1px solid var(--rs-border-primary);
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ItemActionsWrapper = styled.div`
  display: flex;
  gap: 4px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OptionRow = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
`;

const OptionImageWrapper = styled.div`
  display: grid;
`;

const INPUT_TYPES = ['text', 'email', 'hidden', 'groups'];

const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);

  return next;
};

const swapIndex = (index: number, a: number, b: number) =>
  index === a ? b
  : index === b ? a
  : index;

type ItemActionsProps = {
  disabled?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

function ItemActions({
  disabled,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ItemActionsProps) {
  const { t } = useTranslation();

  return (
    <ItemActionsWrapper>
      {onMoveUp && (
        <IconButtonTooltip caption={t('blocks.mailchimpForm.moveUp')}>
          <IconButton
            size="small"
            aria-label={t('blocks.mailchimpForm.moveUp')}
            disabled={disabled}
            onClick={onMoveUp}
          >
            <MdArrowUpward />
          </IconButton>
        </IconButtonTooltip>
      )}
      {onMoveDown && (
        <IconButtonTooltip caption={t('blocks.mailchimpForm.moveDown')}>
          <IconButton
            size="small"
            aria-label={t('blocks.mailchimpForm.moveDown')}
            disabled={disabled}
            onClick={onMoveDown}
          >
            <MdArrowDownward />
          </IconButton>
        </IconButtonTooltip>
      )}
      <IconButtonTooltip caption={t('blocks.mailchimpForm.remove')}>
        <IconButton
          size="small"
          aria-label={t('blocks.mailchimpForm.remove')}
          disabled={disabled}
          onClick={onRemove}
        >
          <MdDelete />
        </IconButton>
      </IconButtonTooltip>
    </ItemActionsWrapper>
  );
}

const emptyInput = (): MailchimpFormFieldConfigValue => ({
  inputType: 'text',
  name: '',
  label: '',
  description: null,
  required: false,
  urlParam: null,
  defaultValue: null,
  value: null,
  optionsLayout: MailchimpFormOptionsLayout.List,
  options: [],
});

const emptyStep = (): MailchimpFormStepValue => ({
  skipIfFieldsFilled: [],
  skipIfInterestsFilled: [],
  showIfInterestsFilled: [],
  inputs: [emptyInput()],
});

const hasStepConditions = (step: MailchimpFormStepValue) =>
  !!(
    step.skipIfFieldsFilled.length ||
    step.skipIfInterestsFilled.length ||
    step.showIfInterestsFilled.length
  );

const getInputErrors = (input: MailchimpFormFieldConfigValue) => {
  const inputType = input.inputType ?? 'text';

  return {
    name: inputType !== 'groups' && !input.name,
    label: ['text', 'email'].includes(inputType) && !input.label?.trim(),
    options: inputType === 'groups' && !input.options.length,
  };
};

const getMissingInterests = (input: MailchimpFormFieldConfigValue) =>
  input.inputType === 'groups' ? input.options.map(option => !option.id) : [];

const getFormErrors = (value: MailchimpFormBlockValue) => ({
  syncProviderId: !value.syncProviderId,
  listId: !value.listId,
  emailInput: !value.steps.some(step =>
    step.inputs.some(
      input => input.inputType !== 'groups' && input.name === 'EMAIL'
    )
  ),
});

const countErrors = (value: MailchimpFormBlockValue) =>
  [
    ...Object.values(getFormErrors(value)),
    ...value.steps.flatMap(step =>
      step.inputs.flatMap(input => [
        ...Object.values(getInputErrors(input)),
        ...getMissingInterests(input),
      ])
    ),
  ].filter(Boolean).length;

const emptyInterestOption = (): MailchimpFormInterestOptionValue => ({
  id: '',
  name: '',
  description: null,
  image: null,
});

type MailchimpFormInterestOptionItemProps = {
  value: MailchimpFormInterestOptionValue;
  number: number;
  interestOptions: { value: string; label: string }[];
  disabled?: boolean;
  showErrors: boolean;
  onChange: (patch: Partial<MailchimpFormInterestOptionValue>) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

function MailchimpFormInterestOptionItem({
  value,
  number,
  interestOptions,
  disabled,
  showErrors,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: MailchimpFormInterestOptionItemProps) {
  const { t } = useTranslation();
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const interestLabel = (id: string | null) =>
    interestOptions.find(option => option.value === id)?.label;

  return (
    <ItemPanel>
      <CardContent>
        <ItemHeader>
          <Heading>
            {value.name ||
              t('blocks.mailchimpForm.interestOptionTitle', { number })}
          </Heading>
          <ItemActions
            disabled={disabled}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
          />
        </ItemHeader>

        <OptionRow>
          <Field>
            <Label>{t('blocks.mailchimpForm.interestOptionImage')}</Label>
            <OptionImageWrapper>
              <ChooseEditImage
                header=""
                image={value.image}
                disabled={!!disabled}
                maxHeight={120}
                openChooseModalOpen={() => setChooseModalOpen(true)}
                openEditModalOpen={() => setEditModalOpen(true)}
                removeImage={() => onChange({ image: null })}
              />
            </OptionImageWrapper>
          </Field>

          <Field>
            <Grid
              container
              spacing={2}
            >
              <Field>
                <Label>{t('blocks.mailchimpForm.interestOption')}</Label>
                <SelectPicker
                  block
                  cleanable={false}
                  disabled={disabled}
                  data={interestOptions}
                  value={value.id || null}
                  onChange={id =>
                    onChange({
                      id: id ?? '',
                      name:
                        !value.name || value.name === interestLabel(value.id) ?
                          (interestLabel(id) ?? '')
                        : value.name,
                    })
                  }
                  placeholder={t(
                    'blocks.mailchimpForm.interestOptionPlaceholder'
                  )}
                />
                {showErrors && !value.id && (
                  <ErrorText>
                    {t('blocks.mailchimpForm.interestOptionRequired')}
                  </ErrorText>
                )}
              </Field>
              <Field>
                <Label>{t('blocks.mailchimpForm.interestOptionName')}</Label>
                <Input
                  disabled={disabled}
                  value={value.name}
                  onChange={name => onChange({ name })}
                />
              </Field>
            </Grid>

            <Field>
              <Label>
                {t('blocks.mailchimpForm.interestOptionDescription')}
              </Label>
              <Input
                as="textarea"
                rows={2}
                disabled={disabled}
                value={value.description ?? ''}
                onChange={description => onChange({ description })}
              />
            </Field>
          </Field>
        </OptionRow>

        <Drawer
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isChooseModalOpen}
          onClose={() => setChooseModalOpen(false)}
        >
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={image => {
              setChooseModalOpen(false);
              onChange({ image });
            }}
          />
        </Drawer>

        {value.image && (
          <Drawer
            anchor="right"
            slotProps={{
              paper: {
                sx: {
                  display: 'flex',
                  flexDirection: 'column',
                  width: DRAWER_WIDTHS.sm,
                  maxWidth: '100vw',
                },
              },
            }}
            open={isEditModalOpen}
            onClose={() => setEditModalOpen(false)}
          >
            <ImageEditPanel
              id={value.image.id}
              onClose={() => setEditModalOpen(false)}
              onSave={() => setEditModalOpen(false)}
            />
          </Drawer>
        )}
      </CardContent>
    </ItemPanel>
  );
}

const emptySuccessOption = (): MailchimpFormSuccessOptionValue => ({
  label: '',
  background: '#ff8900',
  url: '',
  mergeFieldName: null,
  mergeFieldValue: null,
});

export function MailchimpFormBlock({
  value,
  onChange,
  disabled,
}: BlockProps<MailchimpFormBlockValue>) {
  const { t } = useTranslation();

  const [advancedSections, setAdvancedSections] = useState<Set<string>>(
    () =>
      new Set(
        value.steps.flatMap((step, stepIndex) =>
          hasStepConditions(step) ? [`step-${stepIndex}`] : []
        )
      )
  );

  const toggleAdvanced = (key: string, enabled: boolean) =>
    setAdvancedSections(current => {
      const next = new Set(current);
      if (enabled) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

  const remapAdvanced = (
    remap: (stepIndex: number, inputIndex: number) => [number, number]
  ) =>
    setAdvancedSections(
      current =>
        new Set(
          [...current].map(key => {
            if (key.startsWith('step-')) {
              const [stepIndex] = remap(Number(key.slice('step-'.length)), -1);
              return `step-${stepIndex}`;
            }

            const [stepIndex, inputIndex] = key.split('-').map(Number);
            return remap(stepIndex, inputIndex).join('-');
          })
        )
    );

  const update = (patch: Partial<MailchimpFormBlockValue>) =>
    onChange(current => ({ ...current, ...patch }));

  const validatorId = useId();
  const [saveAttempted, setSaveAttempted] = useState(false);
  const formErrors = getFormErrors(value);
  const errorCount = value.disabled ? 0 : countErrors(value);

  useRegisterValidator(`mailchimp-form-${validatorId}`, () => {
    if (!errorCount) {
      return { ok: true };
    }

    setSaveAttempted(true);

    return {
      ok: false,
      summary: t(
        errorCount === 1 ?
          'blocks.mailchimpForm.validationSummaryOne'
        : 'blocks.mailchimpForm.validationSummaryMany',
        { count: errorCount }
      ),
    };
  });

  const showErrors = saveAttempted && !value.disabled;

  const { data: syncData, loading: syncLoading } = useQuery(
    SyncProviderSettingsDocument
  );

  const providerOptions = useMemo(
    () =>
      (syncData?.syncProviderSettings ?? []).map(provider => ({
        value: provider.id,
        label: provider.name ?? provider.id,
      })),
    [syncData?.syncProviderSettings]
  );

  const { data: listsData, loading: listsLoading } = useQuery(
    MailchimpListsDocument,
    {
      skip: !value.syncProviderId,
      variables: { configId: value.syncProviderId ?? '' },
    }
  );

  const listOptions = useMemo(
    () =>
      (listsData?.mailchimpLists ?? []).map(list => ({
        value: list.id,
        label: list.name,
      })),
    [listsData?.mailchimpLists]
  );

  const { data: interestData } = useQuery(MailchimpInterestGroupsDocument, {
    skip: !value.syncProviderId || !value.listId,
    variables: {
      configId: value.syncProviderId ?? '',
      listId: value.listId ?? '',
    },
  });

  const interestOptions = useMemo(
    () =>
      (interestData?.mailchimpInterestGroups ?? []).map(group => ({
        value: group.id,
        label: group.name,
      })),
    [interestData?.mailchimpInterestGroups]
  );

  const { data: mergeFieldData, loading: mergeFieldsLoading } = useQuery(
    MailchimpMergeFieldsDocument,
    {
      skip: !value.syncProviderId || !value.listId,
      variables: {
        configId: value.syncProviderId ?? '',
        listId: value.listId ?? '',
      },
    }
  );

  const mergeFieldOptions = useMemo(() => {
    const fields = (mergeFieldData?.mailchimpMergeFields ?? [])
      .filter(field => field.tag !== 'EMAIL')
      .map(field => ({
        value: field.tag,
        label: `${field.name} (${field.tag})`,
      }));

    return [
      {
        value: 'EMAIL',
        label: `${t('blocks.mailchimpForm.emailMergeField')} (EMAIL)`,
      },
      ...fields,
    ];
  }, [mergeFieldData?.mailchimpMergeFields, t]);

  const fieldNameOptions = useMemo(
    () =>
      value.steps
        .flatMap(step => step.inputs)
        .filter(input => !!input.name)
        .map(input => ({
          value: input.name as string,
          label: input.name as string,
        })),
    [value.steps]
  );

  return (
    <div>
      <Panel>
        <CardHeader title={t('blocks.mailchimpForm.general')} />

        <CardContent>
          <Grid
            container
            spacing={2}
          >
            <Field>
              <Label>{t('blocks.mailchimpForm.syncProvider')}</Label>
              <SelectPicker
                block
                cleanable
                disabled={disabled}
                loading={syncLoading}
                data={providerOptions}
                value={value.syncProviderId ?? null}
                onChange={syncProviderId =>
                  update({ syncProviderId, listId: null })
                }
                placeholder={t('blocks.mailchimpForm.syncProviderPlaceholder')}
              />
              {showErrors && formErrors.syncProviderId && (
                <ErrorText>
                  {t('blocks.mailchimpForm.syncProviderRequired')}
                </ErrorText>
              )}
            </Field>

            <Field>
              <Label>{t('blocks.mailchimpForm.list')}</Label>
              <SelectPicker
                block
                cleanable
                disabled={disabled || !value.syncProviderId}
                loading={listsLoading}
                data={listOptions}
                value={value.listId ?? null}
                onChange={listId => update({ listId })}
                placeholder={t('blocks.mailchimpForm.listPlaceholder')}
              />
              {showErrors && formErrors.listId && (
                <ErrorText>{t('blocks.mailchimpForm.listRequired')}</ErrorText>
              )}
            </Field>
          </Grid>

          <Field>
            <Label>{t('blocks.mailchimpForm.interests')}</Label>
            <TagPicker
              block
              disabled={disabled}
              data={interestOptions}
              value={value.interests}
              creatable
              onChange={interests => update({ interests: interests ?? [] })}
              placeholder={t('blocks.mailchimpForm.interestsPlaceholder')}
            />
          </Field>

          <Grid
            container
            spacing={2}
          >
            <ToggleRow>
              <FormControlLabel
                control={
                  <Switch
                    disabled={disabled}
                    checked={value.autoFocus}
                    onChange={(_event, autoFocus) => update({ autoFocus })}
                  />
                }
                label={
                  <>
                    {t('blocks.mailchimpForm.autoFocus')}{' '}
                    <InfoTooltip
                      text={t('blocks.mailchimpForm.autoFocusHelp')}
                    />
                  </>
                }
              />
            </ToggleRow>

            <ToggleRow>
              <FormControlLabel
                control={
                  <Switch
                    disabled={disabled}
                    checked={value.doubleOptIn ?? false}
                    onChange={(_event, doubleOptIn) => update({ doubleOptIn })}
                  />
                }
                label={
                  <>
                    {t('blocks.mailchimpForm.doubleOptIn')}{' '}
                    <InfoTooltip
                      text={t('blocks.mailchimpForm.doubleOptInHelp')}
                    />
                  </>
                }
              />
            </ToggleRow>
          </Grid>

          <Grid
            container
            spacing={2}
          >
            <Field>
              <Label>{t('blocks.mailchimpForm.submitButtonLabel')}</Label>
              <Input
                disabled={disabled}
                value={value.submitButtonLabel ?? ''}
                onChange={submitButtonLabel => update({ submitButtonLabel })}
              />
            </Field>
            <Grid
              container
              spacing={2}
            >
              <Field>
                <Label>{t('blocks.mailchimpForm.buttonColor')}</Label>
                <Input
                  type="color"
                  disabled={disabled}
                  value={value.buttonColor ?? '#ffd60a'}
                  onChange={buttonColor => update({ buttonColor })}
                />
              </Field>
              <Field>
                <Label>{t('blocks.mailchimpForm.buttonFontColor')}</Label>
                <Input
                  type="color"
                  disabled={disabled}
                  value={value.buttonFontColor ?? '#000000'}
                  onChange={buttonFontColor => update({ buttonFontColor })}
                />
              </Field>
            </Grid>
          </Grid>
        </CardContent>
      </Panel>

      <Panel>
        <CardHeader title={t('blocks.mailchimpForm.steps')} />

        <CardContent>
          {showErrors && formErrors.emailInput && (
            <ErrorText>
              {t('blocks.mailchimpForm.emailInputRequired')}
            </ErrorText>
          )}
          {value.steps.map((step, stepIndex) => {
            const updateStep = (patch: Partial<MailchimpFormStepValue>) =>
              update({
                steps: value.steps.map((s, i) =>
                  i === stepIndex ? { ...s, ...patch } : s
                ),
              });

            const moveStep = (to: number) => {
              update({ steps: moveItem(value.steps, stepIndex, to) });
              remapAdvanced((s, i) => [swapIndex(s, stepIndex, to), i]);
            };

            const stepAdvancedKey = `step-${stepIndex}`;
            const showStepAdvanced = advancedSections.has(stepAdvancedKey);

            return (
              <ItemPanel key={stepIndex}>
                <CardContent>
                  <ItemHeader>
                    <Heading>
                      {t('blocks.mailchimpForm.step', {
                        number: stepIndex + 1,
                      })}
                    </Heading>
                    <ItemActions
                      disabled={disabled}
                      onMoveUp={
                        stepIndex > 0 ?
                          () => moveStep(stepIndex - 1)
                        : undefined
                      }
                      onMoveDown={
                        stepIndex < value.steps.length - 1 ?
                          () => moveStep(stepIndex + 1)
                        : undefined
                      }
                      onRemove={() =>
                        update({
                          steps: value.steps.filter((_, i) => i !== stepIndex),
                        })
                      }
                    />
                  </ItemHeader>

                  <ToggleRow>
                    <FormControlLabel
                      control={
                        <Switch
                          disabled={disabled}
                          checked={showStepAdvanced}
                          onChange={(_event, enabled) =>
                            toggleAdvanced(stepAdvancedKey, enabled)
                          }
                        />
                      }
                      label={
                        <>
                          {t('blocks.mailchimpForm.advanced')}{' '}
                          <InfoTooltip
                            text={t('blocks.mailchimpForm.advancedStepHelp')}
                          />
                        </>
                      }
                    />
                  </ToggleRow>

                  {showStepAdvanced && (
                    <>
                      <Field>
                        <Label>
                          {t('blocks.mailchimpForm.skipIfFieldsFilled')}
                        </Label>
                        <TagPicker
                          block
                          creatable
                          disabled={disabled}
                          data={fieldNameOptions}
                          value={step.skipIfFieldsFilled}
                          onChange={skipIfFieldsFilled =>
                            updateStep({
                              skipIfFieldsFilled: skipIfFieldsFilled ?? [],
                            })
                          }
                        />
                      </Field>
                      <Field>
                        <Label>
                          {t('blocks.mailchimpForm.skipIfInterestsFilled')}
                        </Label>
                        <TagPicker
                          block
                          creatable
                          disabled={disabled}
                          data={interestOptions}
                          value={step.skipIfInterestsFilled}
                          onChange={skipIfInterestsFilled =>
                            updateStep({
                              skipIfInterestsFilled:
                                skipIfInterestsFilled ?? [],
                            })
                          }
                        />
                      </Field>
                      <Field>
                        <Label>
                          {t('blocks.mailchimpForm.showIfInterestsFilled')}
                        </Label>
                        <TagPicker
                          block
                          creatable
                          disabled={disabled}
                          data={interestOptions}
                          value={step.showIfInterestsFilled}
                          onChange={showIfInterestsFilled =>
                            updateStep({
                              showIfInterestsFilled:
                                showIfInterestsFilled ?? [],
                            })
                          }
                        />
                      </Field>
                    </>
                  )}

                  <Divider>{t('blocks.mailchimpForm.inputs')}</Divider>

                  {step.inputs.map((input, inputIndex) => {
                    const updateInput = (
                      patch: Partial<MailchimpFormFieldConfigValue>
                    ) =>
                      updateStep({
                        inputs: step.inputs.map((inp, i) =>
                          i === inputIndex ? { ...inp, ...patch } : inp
                        ),
                      });

                    const moveInput = (to: number) => {
                      updateStep({
                        inputs: moveItem(step.inputs, inputIndex, to),
                      });
                      remapAdvanced((s, i) => [
                        s,
                        s === stepIndex ? swapIndex(i, inputIndex, to) : i,
                      ]);
                    };

                    const advancedKey = `${stepIndex}-${inputIndex}`;
                    const showAdvanced = advancedSections.has(advancedKey);
                    const inputErrors = getInputErrors(input);

                    return (
                      <ItemPanel key={inputIndex}>
                        <CardContent>
                          <ItemHeader>
                            <Heading>
                              {input.name ||
                                input.label ||
                                t('blocks.mailchimpForm.inputTitle', {
                                  number: inputIndex + 1,
                                })}
                            </Heading>
                            <ItemActions
                              disabled={disabled}
                              onMoveUp={
                                inputIndex > 0 ?
                                  () => moveInput(inputIndex - 1)
                                : undefined
                              }
                              onMoveDown={
                                inputIndex < step.inputs.length - 1 ?
                                  () => moveInput(inputIndex + 1)
                                : undefined
                              }
                              onRemove={() =>
                                updateStep({
                                  inputs: step.inputs.filter(
                                    (_, i) => i !== inputIndex
                                  ),
                                })
                              }
                            />
                          </ItemHeader>

                          <Grid
                            container
                            spacing={2}
                          >
                            <Field>
                              <Label>
                                {t('blocks.mailchimpForm.inputType')}
                              </Label>
                              <SelectPicker
                                block
                                cleanable={false}
                                searchable={false}
                                disabled={disabled}
                                data={INPUT_TYPES.map(type => ({
                                  value: type,
                                  label: t(
                                    `blocks.mailchimpForm.inputTypes.${type}`
                                  ),
                                }))}
                                value={input.inputType ?? 'text'}
                                onChange={inputType =>
                                  updateInput({ inputType })
                                }
                              />
                              <HelpText>
                                {input.inputType === 'groups' ?
                                  t('blocks.mailchimpForm.inputTypeGroupsHelp')
                                : t('blocks.mailchimpForm.inputTypeHelp')}
                              </HelpText>
                            </Field>
                            <ToggleRow>
                              <FormControlLabel
                                control={
                                  <Switch
                                    disabled={disabled}
                                    checked={input.required ?? false}
                                    onChange={(_event, required) =>
                                      updateInput({ required })
                                    }
                                  />
                                }
                                label={t('blocks.mailchimpForm.required')}
                              />
                            </ToggleRow>
                          </Grid>

                          <Grid
                            container
                            spacing={2}
                          >
                            {input.inputType !== 'groups' && (
                              <Field>
                                <Label>
                                  {t('blocks.mailchimpForm.inputName')}
                                </Label>
                                <InputPicker
                                  block
                                  creatable
                                  cleanable={false}
                                  disabled={disabled}
                                  loading={mergeFieldsLoading}
                                  data={mergeFieldOptions}
                                  value={input.name || null}
                                  onChange={name =>
                                    updateInput({ name: name ?? '' })
                                  }
                                  placeholder={t(
                                    'blocks.mailchimpForm.mergeFieldPlaceholder'
                                  )}
                                />
                                {showErrors && inputErrors.name && (
                                  <ErrorText>
                                    {t(
                                      'blocks.mailchimpForm.inputNameRequired'
                                    )}
                                  </ErrorText>
                                )}
                                <HelpText>
                                  {t('blocks.mailchimpForm.inputNameHelp')}
                                </HelpText>
                              </Field>
                            )}
                            <Field>
                              <Label>
                                {t('blocks.mailchimpForm.inputLabel')}
                              </Label>
                              <Input
                                disabled={disabled}
                                value={input.label ?? ''}
                                onChange={label => updateInput({ label })}
                              />
                              {showErrors && inputErrors.label && (
                                <ErrorText>
                                  {t('blocks.mailchimpForm.inputLabelRequired')}
                                </ErrorText>
                              )}
                              <HelpText>
                                {input.inputType === 'groups' ?
                                  t('blocks.mailchimpForm.inputLabelGroupsHelp')
                                : t('blocks.mailchimpForm.inputLabelHelp')}
                              </HelpText>
                            </Field>
                          </Grid>

                          <ToggleRow>
                            <FormControlLabel
                              control={
                                <Switch
                                  disabled={disabled}
                                  checked={showAdvanced}
                                  onChange={(_event, enabled) =>
                                    toggleAdvanced(advancedKey, enabled)
                                  }
                                />
                              }
                              label={
                                <>
                                  {t('blocks.mailchimpForm.advanced')}{' '}
                                  <InfoTooltip
                                    text={t(
                                      'blocks.mailchimpForm.advancedInputHelp'
                                    )}
                                  />
                                </>
                              }
                            />
                          </ToggleRow>

                          {showAdvanced && (
                            <Field>
                              <Label>
                                {t('blocks.mailchimpForm.inputDescription')}
                              </Label>
                              <Input
                                disabled={disabled}
                                value={input.description ?? ''}
                                onChange={description =>
                                  updateInput({ description })
                                }
                              />
                              <HelpText>
                                {t('blocks.mailchimpForm.inputDescriptionHelp')}
                              </HelpText>
                            </Field>
                          )}

                          {showAdvanced && input.inputType !== 'groups' && (
                            <Grid
                              container
                              spacing={2}
                            >
                              <Field>
                                <Label>
                                  {t('blocks.mailchimpForm.fieldUrlParam')}
                                </Label>
                                <Input
                                  disabled={disabled}
                                  value={input.urlParam ?? ''}
                                  onChange={urlParam =>
                                    updateInput({ urlParam })
                                  }
                                />
                                <HelpText>
                                  {t('blocks.mailchimpForm.fieldUrlParamHelp')}
                                </HelpText>
                              </Field>
                              <Field>
                                <Label>
                                  {t('blocks.mailchimpForm.fieldDefaultValue')}
                                </Label>
                                <Input
                                  disabled={disabled}
                                  value={input.defaultValue ?? ''}
                                  onChange={defaultValue =>
                                    updateInput({ defaultValue })
                                  }
                                />
                                <HelpText>
                                  {t(
                                    'blocks.mailchimpForm.fieldDefaultValueHelp'
                                  )}
                                </HelpText>
                              </Field>
                              <Field>
                                <Label>
                                  {t('blocks.mailchimpForm.fieldValue')}
                                </Label>
                                <Input
                                  disabled={disabled}
                                  value={input.value ?? ''}
                                  onChange={fieldValue =>
                                    updateInput({ value: fieldValue })
                                  }
                                />
                                <HelpText>
                                  {t('blocks.mailchimpForm.fieldValueHelp')}
                                </HelpText>
                              </Field>
                            </Grid>
                          )}

                          {input.inputType === 'groups' && (
                            <Field>
                              <Label>
                                {t('blocks.mailchimpForm.optionsLayout')}
                              </Label>
                              <FormControl disabled={disabled}>
                                <RadioGroup
                                  row
                                  value={
                                    input.optionsLayout ??
                                    MailchimpFormOptionsLayout.List
                                  }
                                  onChange={(_event, optionsLayout) =>
                                    updateInput({
                                      optionsLayout:
                                        optionsLayout as MailchimpFormOptionsLayout,
                                    })
                                  }
                                >
                                  <FormControlLabel
                                    value={MailchimpFormOptionsLayout.List}
                                    control={<Radio />}
                                    label={t(
                                      'blocks.mailchimpForm.optionsLayoutList'
                                    )}
                                  />
                                  <FormControlLabel
                                    value={MailchimpFormOptionsLayout.Grid}
                                    control={<Radio />}
                                    label={t(
                                      'blocks.mailchimpForm.optionsLayoutGrid'
                                    )}
                                  />
                                </RadioGroup>
                              </FormControl>
                            </Field>
                          )}

                          {input.inputType === 'groups' && (
                            <Field>
                              <Label>
                                {t('blocks.mailchimpForm.interestOptions')}
                              </Label>
                              {!value.listId && (
                                <HelpText>
                                  {t(
                                    'blocks.mailchimpForm.interestOptionsNoList'
                                  )}
                                </HelpText>
                              )}
                              {showErrors && inputErrors.options && (
                                <ErrorText>
                                  {t(
                                    'blocks.mailchimpForm.interestOptionsRequired'
                                  )}
                                </ErrorText>
                              )}
                              {input.options.map((option, optionIndex) => (
                                <MailchimpFormInterestOptionItem
                                  key={optionIndex}
                                  value={option}
                                  number={optionIndex + 1}
                                  showErrors={showErrors}
                                  interestOptions={interestOptions}
                                  disabled={disabled}
                                  onChange={patch =>
                                    updateInput({
                                      options: input.options.map((o, i) =>
                                        i === optionIndex ?
                                          { ...o, ...patch }
                                        : o
                                      ),
                                    })
                                  }
                                  onMoveUp={
                                    optionIndex > 0 ?
                                      () =>
                                        updateInput({
                                          options: moveItem(
                                            input.options,
                                            optionIndex,
                                            optionIndex - 1
                                          ),
                                        })
                                    : undefined
                                  }
                                  onMoveDown={
                                    optionIndex < input.options.length - 1 ?
                                      () =>
                                        updateInput({
                                          options: moveItem(
                                            input.options,
                                            optionIndex,
                                            optionIndex + 1
                                          ),
                                        })
                                    : undefined
                                  }
                                  onRemove={() =>
                                    updateInput({
                                      options: input.options.filter(
                                        (_, i) => i !== optionIndex
                                      ),
                                    })
                                  }
                                />
                              ))}
                              <Button
                                variant="outlined"
                                startIcon={<MdAddCircle />}
                                size="small"
                                disabled={disabled}
                                onClick={() =>
                                  updateInput({
                                    options: [
                                      ...input.options,
                                      emptyInterestOption(),
                                    ],
                                  })
                                }
                              >
                                {t('blocks.mailchimpForm.addInterestOption')}
                              </Button>
                            </Field>
                          )}
                        </CardContent>
                      </ItemPanel>
                    );
                  })}

                  <Button
                    variant="outlined"
                    startIcon={<MdAddCircle />}
                    size="small"
                    disabled={disabled}
                    onClick={() =>
                      updateStep({ inputs: [...step.inputs, emptyInput()] })
                    }
                  >
                    {t('blocks.mailchimpForm.addInput')}
                  </Button>
                </CardContent>
              </ItemPanel>
            );
          })}
          <Button
            variant="outlined"
            startIcon={<MdAddCircle />}
            disabled={disabled}
            onClick={() => update({ steps: [...value.steps, emptyStep()] })}
          >
            {t('blocks.mailchimpForm.addStep')}
          </Button>
        </CardContent>
      </Panel>

      <Panel>
        <CardHeader title={t('blocks.mailchimpForm.success')} />

        <CardContent>
          <Field>
            <Label>{t('blocks.mailchimpForm.successUrl')}</Label>
            <Input
              disabled={disabled || !!value.successPage}
              value={value.successUrl ?? ''}
              onChange={successUrl => update({ successUrl })}
              placeholder={t('blocks.mailchimpForm.successUrlPlaceholder')}
            />
          </Field>

          <ToggleRow>
            <FormControlLabel
              control={
                <Switch
                  disabled={disabled}
                  checked={!!value.successPage}
                  onChange={(_event, enabled) =>
                    update({
                      successPage:
                        enabled ? { description: '', options: [] } : null,
                      successUrl: enabled ? null : value.successUrl,
                    })
                  }
                />
              }
              label={t('blocks.mailchimpForm.useSuccessPage')}
            />
          </ToggleRow>

          {value.successPage && (
            <ItemPanel>
              <CardContent>
                <Field>
                  <Label>
                    {t('blocks.mailchimpForm.successPageDescription')}
                  </Label>
                  <Input
                    as="textarea"
                    rows={2}
                    disabled={disabled}
                    value={value.successPage.description ?? ''}
                    onChange={description =>
                      update({
                        successPage: { ...value.successPage!, description },
                      })
                    }
                  />
                </Field>

                {value.successPage.options.map((option, optionIndex) => {
                  const updateOption = (
                    patch: Partial<MailchimpFormSuccessOptionValue>
                  ) =>
                    update({
                      successPage: {
                        ...value.successPage!,
                        options: value.successPage!.options.map((o, i) =>
                          i === optionIndex ? { ...o, ...patch } : o
                        ),
                      },
                    });

                  return (
                    <ItemPanel key={optionIndex}>
                      <CardContent>
                        <ItemHeader>
                          <Heading>
                            {option.label ||
                              t('blocks.mailchimpForm.successOptionTitle', {
                                number: optionIndex + 1,
                              })}
                          </Heading>
                          <IconButtonTooltip
                            caption={t('blocks.mailchimpForm.remove')}
                          >
                            <IconButton
                              size="small"
                              aria-label={t('blocks.mailchimpForm.remove')}
                              disabled={disabled}
                              onClick={() =>
                                update({
                                  successPage: {
                                    ...value.successPage!,
                                    options: value.successPage!.options.filter(
                                      (_, i) => i !== optionIndex
                                    ),
                                  },
                                })
                              }
                            >
                              <MdDelete />
                            </IconButton>
                          </IconButtonTooltip>
                        </ItemHeader>
                        <Grid
                          container
                          spacing={2}
                        >
                          <Field>
                            <Label>
                              {t('blocks.mailchimpForm.optionLabel')}
                            </Label>
                            <Input
                              disabled={disabled}
                              value={option.label}
                              onChange={label => updateOption({ label })}
                            />
                          </Field>
                          <Field>
                            <Label>
                              {t('blocks.mailchimpForm.optionBackground')}
                            </Label>
                            <Input
                              type="color"
                              disabled={disabled}
                              value={option.background || '#ff8900'}
                              onChange={background =>
                                updateOption({ background })
                              }
                            />
                          </Field>
                        </Grid>
                        <Field>
                          <Label>{t('blocks.mailchimpForm.optionUrl')}</Label>
                          <Input
                            disabled={disabled}
                            value={option.url}
                            onChange={url => updateOption({ url })}
                          />
                        </Field>
                        <Grid
                          container
                          spacing={2}
                        >
                          <Field>
                            <Label>
                              {t('blocks.mailchimpForm.optionMergeFieldName')}
                            </Label>
                            <InputPicker
                              block
                              creatable
                              disabled={disabled}
                              loading={mergeFieldsLoading}
                              data={mergeFieldOptions}
                              value={option.mergeFieldName || null}
                              onChange={mergeFieldName =>
                                updateOption({
                                  mergeFieldName: mergeFieldName ?? null,
                                })
                              }
                              placeholder={t(
                                'blocks.mailchimpForm.mergeFieldPlaceholder'
                              )}
                            />
                          </Field>
                          <Field>
                            <Label>
                              {t('blocks.mailchimpForm.optionMergeFieldValue')}
                            </Label>
                            <Input
                              disabled={disabled}
                              value={option.mergeFieldValue ?? ''}
                              onChange={mergeFieldValue =>
                                updateOption({ mergeFieldValue })
                              }
                            />
                          </Field>
                        </Grid>
                      </CardContent>
                    </ItemPanel>
                  );
                })}

                <Button
                  variant="outlined"
                  startIcon={<MdAddCircle />}
                  size="small"
                  disabled={disabled}
                  onClick={() =>
                    update({
                      successPage: {
                        ...value.successPage!,
                        options: [
                          ...value.successPage!.options,
                          emptySuccessOption(),
                        ],
                      },
                    })
                  }
                >
                  {t('blocks.mailchimpForm.addSuccessOption')}
                </Button>
              </CardContent>
            </ItemPanel>
          )}
        </CardContent>
      </Panel>
    </div>
  );
}
