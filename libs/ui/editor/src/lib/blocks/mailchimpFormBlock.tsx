import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  Button,
  Checkbox,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import {
  MailchimpFormOptionsLayout,
  MailchimpInterestGroupsDocument,
  MailchimpListsDocument,
  MailchimpMergeFieldsDocument,
  SyncProviderSettingsDocument,
} from '@wepublish/editor/api';
import { ReactNode, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAddCircle,
  MdArrowDownward,
  MdArrowUpward,
  MdDelete,
} from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import {
  BlockSection,
  BlockSectionHeader,
  BlockSections,
} from '../atoms/blockSection';
import { ChooseEditImage } from '../atoms/chooseEditImage';
import { ColorPicker } from '../atoms/colorPicker';
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
  nameForPickedInterest,
} from './types';

const FieldGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;
`;

const Stack = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-items: stretch;

  & > .MuiButton-root,
  & > .MuiFormControlLabel-root {
    justify-self: start;
  }
`;

const CheckboxRow = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(0, 3)};
`;

const ItemList = styled('ul')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Item = styled('li', {
  shouldForwardProp: prop => prop !== 'surface',
})<{ surface: 'default' | 'paper' }>`
  container-type: inline-size;
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme, surface }) =>
    theme.vars.palette.background[surface]};

  & > .MuiButton-root,
  & > .MuiFormControlLabel-root {
    justify-self: start;
  }
`;

const ItemHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  min-height: 32px;
`;

const ItemActionsWrapper = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
  margin-right: ${({ theme }) => theme.spacing(-1)};
`;

const OptionRow = styled('div')`
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(2)};

  @container (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ItemTitle = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="subtitle2"
    component="h4"
  >
    {children}
  </Typography>
);

const SubHeading = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="overline"
    color="text.secondary"
    sx={{ lineHeight: 1.5 }}
  >
    {children}
  </Typography>
);

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

export const emptyInterestOption = (): MailchimpFormInterestOptionValue => ({
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

export function MailchimpFormInterestOptionItem({
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
    <Item surface="default">
      <ItemHeader>
        <ItemTitle>
          {value.name ||
            t('blocks.mailchimpForm.interestOptionTitle', { number })}
        </ItemTitle>
        <ItemActions
          disabled={disabled}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
        />
      </ItemHeader>

      <OptionRow>
        <Stack>
          <FormLabel>{t('blocks.mailchimpForm.interestOptionImage')}</FormLabel>
          <ChooseEditImage
            onSelect={image => {
              setChooseModalOpen(false);
              onChange({ image });
            }}
            image={value.image}
            disabled={!!disabled}
            maxHeight={120}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => onChange({ image: null })}
          />
        </Stack>

        <Stack>
          <FieldGrid>
            <Autocomplete
              options={interestOptions}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, selected) =>
                option.value === selected.value
              }
              value={
                interestOptions.find(option => option.value === value.id) ??
                undefined
              }
              onChange={(_event, option) => {
                const id = option.value;
                onChange({
                  id: id ?? '',
                  name: nameForPickedInterest(value, id, interestLabel),
                });
              }}
              disableClearable
              disabled={disabled}
              renderInput={params => (
                <TextField
                  {...params}
                  label={t('blocks.mailchimpForm.interestOption')}
                  placeholder={t(
                    'blocks.mailchimpForm.interestOptionPlaceholder'
                  )}
                  error={showErrors && !value.id}
                  helperText={
                    showErrors && !value.id ?
                      t('blocks.mailchimpForm.interestOptionRequired')
                    : undefined
                  }
                />
              )}
            />

            <TextField
              label={t('blocks.mailchimpForm.interestOptionName')}
              disabled={disabled}
              value={value.name}
              onChange={event => onChange({ name: event.target.value })}
            />
          </FieldGrid>

          <TextField
            label={t('blocks.mailchimpForm.interestOptionDescription')}
            rows={2}
            disabled={disabled}
            value={value.description ?? ''}
            onChange={event => onChange({ description: event.target.value })}
            multiline
          />
        </Stack>
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
    </Item>
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

  const multiPicker = (
    options: { value: string; label: string }[],
    selected: string[],
    label: string,
    onSelect: (values: string[]) => void
  ) => (
    <Autocomplete
      multiple
      freeSolo
      options={options.map(option => option.value)}
      getOptionLabel={option =>
        options.find(known => known.value === option)?.label ?? option
      }
      value={selected}
      onChange={(_event, values) => onSelect(values)}
      disabled={disabled}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
        />
      )}
    />
  );

  return (
    <BlockSections>
      <BlockSection>
        <BlockSectionHeader title={t('blocks.mailchimpForm.general')} />

        <FieldGrid>
          <Autocomplete
            options={providerOptions}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, selected) =>
              option.value === selected.value
            }
            value={
              providerOptions.find(
                option => option.value === value.syncProviderId
              ) ?? null
            }
            onChange={(_event, option) => {
              const syncProviderId = option?.value ?? null;
              update({ syncProviderId, listId: null });
            }}
            disabled={disabled}
            loading={syncLoading}
            renderInput={params => (
              <TextField
                {...params}
                label={t('blocks.mailchimpForm.syncProvider')}
                placeholder={t('blocks.mailchimpForm.syncProviderPlaceholder')}
                error={showErrors && formErrors.syncProviderId}
                helperText={
                  showErrors && formErrors.syncProviderId ?
                    t('blocks.mailchimpForm.syncProviderRequired')
                  : undefined
                }
              />
            )}
          />

          <Autocomplete
            options={listOptions}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, selected) =>
              option.value === selected.value
            }
            value={
              listOptions.find(option => option.value === value.listId) ?? null
            }
            onChange={(_event, option) => {
              const listId = option?.value ?? null;
              update({ listId });
            }}
            disabled={disabled || !value.syncProviderId}
            loading={listsLoading}
            renderInput={params => (
              <TextField
                {...params}
                label={t('blocks.mailchimpForm.list')}
                placeholder={t('blocks.mailchimpForm.listPlaceholder')}
                error={showErrors && formErrors.listId}
                helperText={
                  showErrors && formErrors.listId ?
                    t('blocks.mailchimpForm.listRequired')
                  : undefined
                }
              />
            )}
          />
        </FieldGrid>

        <Autocomplete
          multiple
          freeSolo
          options={interestOptions.map(option => option.value)}
          getOptionLabel={option =>
            interestOptions.find(known => known.value === option)?.label ??
            option
          }
          value={value.interests}
          onChange={(_event, interests) => {
            update({ interests });
          }}
          disabled={disabled}
          renderInput={params => (
            <TextField
              {...params}
              label={t('blocks.mailchimpForm.interests')}
              placeholder={t('blocks.mailchimpForm.interestsPlaceholder')}
              helperText={t('blocks.mailchimpForm.interestsHelp')}
            />
          )}
        />

        <CheckboxRow>
          <FormControlLabel
            control={
              <Checkbox
                disabled={disabled}
                checked={value.autoFocus}
                onChange={(_event, autoFocus) => update({ autoFocus })}
              />
            }
            label={
              <>
                {t('blocks.mailchimpForm.autoFocus')}{' '}
                <InfoTooltip text={t('blocks.mailchimpForm.autoFocusHelp')} />
              </>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                disabled={disabled}
                checked={value.doubleOptIn ?? false}
                onChange={(_event, doubleOptIn) => update({ doubleOptIn })}
              />
            }
            label={
              <>
                {t('blocks.mailchimpForm.doubleOptIn')}{' '}
                <InfoTooltip text={t('blocks.mailchimpForm.doubleOptInHelp')} />
              </>
            }
          />
        </CheckboxRow>

        <FieldGrid>
          <TextField
            label={t('blocks.mailchimpForm.submitButtonLabel')}
            disabled={disabled}
            value={value.submitButtonLabel ?? ''}
            onChange={event =>
              update({ submitButtonLabel: event.target.value })
            }
          />

          <ColorPicker
            label={t('blocks.mailchimpForm.buttonColor')}
            disabled={disabled}
            value={value.buttonColor ?? '#ffd60a'}
            onChange={event => update({ buttonColor: event.target.value })}
          />

          <ColorPicker
            label={t('blocks.mailchimpForm.buttonFontColor')}
            disabled={disabled}
            value={value.buttonFontColor ?? '#000000'}
            onChange={event => update({ buttonFontColor: event.target.value })}
          />
        </FieldGrid>
      </BlockSection>

      <BlockSection>
        <BlockSectionHeader title={t('blocks.mailchimpForm.steps')} />

        {showErrors && formErrors.emailInput && (
          <FormHelperText error>
            {t('blocks.mailchimpForm.emailInputRequired')}
          </FormHelperText>
        )}

        <ItemList>
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
              <Item
                surface="default"
                key={stepIndex}
              >
                <ItemHeader>
                  <ItemTitle>
                    {t('blocks.mailchimpForm.step', {
                      number: stepIndex + 1,
                    })}
                  </ItemTitle>
                  <ItemActions
                    disabled={disabled}
                    onMoveUp={
                      stepIndex > 0 ? () => moveStep(stepIndex - 1) : undefined
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

                <FormControlLabel
                  control={
                    <Checkbox
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

                {showStepAdvanced && (
                  <Stack>
                    {multiPicker(
                      fieldNameOptions,
                      step.skipIfFieldsFilled,
                      t('blocks.mailchimpForm.skipIfFieldsFilled'),
                      skipIfFieldsFilled => updateStep({ skipIfFieldsFilled })
                    )}
                    {multiPicker(
                      interestOptions,
                      step.skipIfInterestsFilled,
                      t('blocks.mailchimpForm.skipIfInterestsFilled'),
                      skipIfInterestsFilled =>
                        updateStep({ skipIfInterestsFilled })
                    )}
                    {multiPicker(
                      interestOptions,
                      step.showIfInterestsFilled,
                      t('blocks.mailchimpForm.showIfInterestsFilled'),
                      showIfInterestsFilled =>
                        updateStep({ showIfInterestsFilled })
                    )}
                  </Stack>
                )}

                <SubHeading>{t('blocks.mailchimpForm.inputs')}</SubHeading>

                <ItemList>
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
                    const isGroups = input.inputType === 'groups';

                    return (
                      <Item
                        surface="paper"
                        key={inputIndex}
                      >
                        <ItemHeader>
                          <ItemTitle>
                            {input.name ||
                              input.label ||
                              t('blocks.mailchimpForm.inputTitle', {
                                number: inputIndex + 1,
                              })}
                          </ItemTitle>
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

                        <FieldGrid>
                          <TextField
                            select
                            label={t('blocks.mailchimpForm.inputType')}
                            disabled={disabled}
                            value={input.inputType ?? 'text'}
                            onChange={event => {
                              const inputType = event.target.value;
                              updateInput({ inputType });
                            }}
                            helperText={
                              isGroups ?
                                t('blocks.mailchimpForm.inputTypeGroupsHelp')
                              : t('blocks.mailchimpForm.inputTypeHelp')
                            }
                          >
                            {INPUT_TYPES.map(type => (
                              <MenuItem
                                key={type}
                                value={type}
                              >
                                {t(`blocks.mailchimpForm.inputTypes.${type}`)}
                              </MenuItem>
                            ))}
                          </TextField>

                          {!isGroups && (
                            <Autocomplete
                              freeSolo
                              disableClearable
                              disabled={disabled}
                              loading={mergeFieldsLoading}
                              options={mergeFieldOptions.map(
                                option => option.value
                              )}
                              getOptionLabel={option =>
                                mergeFieldOptions.find(
                                  known => known.value === option
                                )?.label ?? option
                              }
                              value={input.name || ''}
                              onInputChange={(_event, name) =>
                                updateInput({ name })
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  label={t('blocks.mailchimpForm.inputName')}
                                  placeholder={t(
                                    'blocks.mailchimpForm.mergeFieldPlaceholder'
                                  )}
                                  error={showErrors && inputErrors.name}
                                  helperText={
                                    showErrors && inputErrors.name ?
                                      t(
                                        'blocks.mailchimpForm.inputNameRequired'
                                      )
                                    : t('blocks.mailchimpForm.inputNameHelp')
                                  }
                                />
                              )}
                            />
                          )}

                          <TextField
                            label={t('blocks.mailchimpForm.inputLabel')}
                            disabled={disabled}
                            value={input.label ?? ''}
                            onChange={event =>
                              updateInput({ label: event.target.value })
                            }
                            error={showErrors && inputErrors.label}
                            helperText={
                              showErrors && inputErrors.label ?
                                t('blocks.mailchimpForm.inputLabelRequired')
                              : isGroups ?
                                t('blocks.mailchimpForm.inputLabelGroupsHelp')
                              : t('blocks.mailchimpForm.inputLabelHelp')
                            }
                          />
                        </FieldGrid>

                        <CheckboxRow>
                          <FormControlLabel
                            control={
                              <Checkbox
                                disabled={disabled}
                                checked={input.required ?? false}
                                onChange={(_event, required) =>
                                  updateInput({ required })
                                }
                              />
                            }
                            label={t('blocks.mailchimpForm.required')}
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
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
                        </CheckboxRow>

                        {showAdvanced && (
                          <TextField
                            label={t('blocks.mailchimpForm.inputDescription')}
                            disabled={disabled}
                            value={input.description ?? ''}
                            onChange={event =>
                              updateInput({
                                description: event.target.value,
                              })
                            }
                            helperText={t(
                              'blocks.mailchimpForm.inputDescriptionHelp'
                            )}
                          />
                        )}

                        {showAdvanced && !isGroups && (
                          <FieldGrid>
                            <TextField
                              label={t('blocks.mailchimpForm.fieldUrlParam')}
                              disabled={disabled}
                              value={input.urlParam ?? ''}
                              onChange={event =>
                                updateInput({ urlParam: event.target.value })
                              }
                              helperText={t(
                                'blocks.mailchimpForm.fieldUrlParamHelp'
                              )}
                            />
                            <TextField
                              label={t(
                                'blocks.mailchimpForm.fieldDefaultValue'
                              )}
                              disabled={disabled}
                              value={input.defaultValue ?? ''}
                              onChange={event =>
                                updateInput({
                                  defaultValue: event.target.value,
                                })
                              }
                              helperText={t(
                                'blocks.mailchimpForm.fieldDefaultValueHelp'
                              )}
                            />
                            <TextField
                              label={t('blocks.mailchimpForm.fieldValue')}
                              disabled={disabled}
                              value={input.value ?? ''}
                              onChange={event =>
                                updateInput({ value: event.target.value })
                              }
                              helperText={t(
                                'blocks.mailchimpForm.fieldValueHelp'
                              )}
                            />
                          </FieldGrid>
                        )}

                        {isGroups && (
                          <FormControl disabled={disabled}>
                            <FormLabel>
                              {t('blocks.mailchimpForm.optionsLayout')}
                            </FormLabel>
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
                        )}

                        {isGroups && (
                          <Stack>
                            <SubHeading>
                              {t('blocks.mailchimpForm.interestOptions')}
                            </SubHeading>

                            {!value.listId && (
                              <FormHelperText>
                                {t(
                                  'blocks.mailchimpForm.interestOptionsNoList'
                                )}
                              </FormHelperText>
                            )}

                            {showErrors && inputErrors.options && (
                              <FormHelperText error>
                                {t(
                                  'blocks.mailchimpForm.interestOptionsRequired'
                                )}
                              </FormHelperText>
                            )}

                            {!!input.options.length && (
                              <ItemList>
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
                              </ItemList>
                            )}

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
                          </Stack>
                        )}
                      </Item>
                    );
                  })}
                </ItemList>

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
              </Item>
            );
          })}
        </ItemList>

        <Stack>
          <Button
            variant="outlined"
            startIcon={<MdAddCircle />}
            disabled={disabled}
            onClick={() => update({ steps: [...value.steps, emptyStep()] })}
          >
            {t('blocks.mailchimpForm.addStep')}
          </Button>
        </Stack>
      </BlockSection>

      <BlockSection>
        <BlockSectionHeader title={t('blocks.mailchimpForm.success')} />

        <TextField
          label={t('blocks.mailchimpForm.successUrl')}
          disabled={disabled || !!value.successPage}
          value={value.successUrl ?? ''}
          onChange={event => update({ successUrl: event.target.value })}
          placeholder={t('blocks.mailchimpForm.successUrlPlaceholder')}
        />

        <Stack>
          <FormControlLabel
            control={
              <Checkbox
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
        </Stack>

        {value.successPage && (
          <Stack>
            <TextField
              label={t('blocks.mailchimpForm.successPageDescription')}
              rows={2}
              disabled={disabled}
              value={value.successPage.description ?? ''}
              onChange={event =>
                update({
                  successPage: {
                    ...value.successPage!,
                    description: event.target.value,
                  },
                })
              }
              multiline
            />

            {!!value.successPage.options.length && (
              <ItemList>
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
                    <Item
                      surface="default"
                      key={optionIndex}
                    >
                      <ItemHeader>
                        <ItemTitle>
                          {option.label ||
                            t('blocks.mailchimpForm.successOptionTitle', {
                              number: optionIndex + 1,
                            })}
                        </ItemTitle>
                        <ItemActions
                          disabled={disabled}
                          onRemove={() =>
                            update({
                              successPage: {
                                ...value.successPage!,
                                options: value.successPage!.options.filter(
                                  (_, i) => i !== optionIndex
                                ),
                              },
                            })
                          }
                        />
                      </ItemHeader>

                      <FieldGrid>
                        <TextField
                          label={t('blocks.mailchimpForm.optionLabel')}
                          disabled={disabled}
                          value={option.label}
                          onChange={event =>
                            updateOption({ label: event.target.value })
                          }
                        />
                        <ColorPicker
                          label={t('blocks.mailchimpForm.optionBackground')}
                          disabled={disabled}
                          value={option.background || '#ff8900'}
                          onChange={event =>
                            updateOption({ background: event.target.value })
                          }
                        />
                      </FieldGrid>

                      <TextField
                        label={t('blocks.mailchimpForm.optionUrl')}
                        disabled={disabled}
                        value={option.url}
                        onChange={event =>
                          updateOption({ url: event.target.value })
                        }
                      />

                      <FieldGrid>
                        <Autocomplete
                          freeSolo
                          disableClearable
                          disabled={disabled}
                          loading={mergeFieldsLoading}
                          options={mergeFieldOptions.map(field => field.value)}
                          getOptionLabel={field =>
                            mergeFieldOptions.find(
                              known => known.value === field
                            )?.label ?? field
                          }
                          value={option.mergeFieldName || ''}
                          onInputChange={(_event, mergeFieldName) =>
                            updateOption({
                              mergeFieldName: mergeFieldName || null,
                            })
                          }
                          renderInput={params => (
                            <TextField
                              {...params}
                              label={t(
                                'blocks.mailchimpForm.optionMergeFieldName'
                              )}
                              placeholder={t(
                                'blocks.mailchimpForm.mergeFieldPlaceholder'
                              )}
                            />
                          )}
                        />
                        <TextField
                          label={t(
                            'blocks.mailchimpForm.optionMergeFieldValue'
                          )}
                          disabled={disabled}
                          value={option.mergeFieldValue ?? ''}
                          onChange={event =>
                            updateOption({
                              mergeFieldValue: event.target.value,
                            })
                          }
                        />
                      </FieldGrid>
                    </Item>
                  );
                })}
              </ItemList>
            )}

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
          </Stack>
        )}
      </BlockSection>
    </BlockSections>
  );
}
