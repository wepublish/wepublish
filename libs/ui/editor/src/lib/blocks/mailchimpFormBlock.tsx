import styled from '@emotion/styled';
import {
  useMailchimpInterestGroupsQuery,
  useMailchimpListsQuery,
  useMailchimpMergeFieldsQuery,
  useSyncProviderSettingsQuery,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAddCircle, MdDelete } from 'react-icons/md';
import {
  Divider,
  IconButton,
  Input,
  InputGroup,
  InputPicker,
  Panel as RPanel,
  SelectPicker,
  TagPicker,
  Toggle,
} from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import {
  MailchimpFormBlockValue,
  MailchimpFormFieldConfigValue,
  MailchimpFormStepValue,
  MailchimpFormSuccessOptionValue,
} from './types';

const Panel = styled(RPanel)`
  background-color: #f7f9fa;
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
  color: #6c757d;
`;

const HelpText = styled('small')`
  font-size: 11px;
  color: #8e8e93;
`;

const ItemPanel = styled(RPanel)`
  background-color: #fff;
  border: 1px solid #e5e5ea;
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const INPUT_TYPES = ['text', 'email', 'hidden', 'groups'];

const emptyInput = (): MailchimpFormFieldConfigValue => ({
  inputType: 'text',
  name: '',
  label: '',
  description: null,
  required: false,
  urlParam: null,
  defaultValue: null,
  value: null,
  options: [],
});

const emptyStep = (): MailchimpFormStepValue => ({
  skipIfFieldsFilled: [],
  skipIfInterestsFilled: [],
  showIfInterestsFilled: [],
  inputs: [emptyInput()],
});

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

  const [advancedInputs, setAdvancedInputs] = useState<Set<string>>(new Set());

  const toggleAdvanced = (key: string, enabled: boolean) =>
    setAdvancedInputs(current => {
      const next = new Set(current);
      if (enabled) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

  const update = (patch: Partial<MailchimpFormBlockValue>) =>
    onChange(current => ({ ...current, ...patch }));

  const { data: syncData, loading: syncLoading } =
    useSyncProviderSettingsQuery();

  const providerOptions = useMemo(
    () =>
      (syncData?.syncProviderSettings ?? []).map(provider => ({
        value: provider.id,
        label: provider.name ?? provider.id,
      })),
    [syncData?.syncProviderSettings]
  );

  const { data: listsData, loading: listsLoading } = useMailchimpListsQuery({
    skip: !value.syncProviderId,
    variables: { configId: value.syncProviderId ?? '' },
  });

  const listOptions = useMemo(
    () =>
      (listsData?.mailchimpLists ?? []).map(list => ({
        value: list.id,
        label: list.name,
      })),
    [listsData?.mailchimpLists]
  );

  const { data: interestData } = useMailchimpInterestGroupsQuery({
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

  const { data: mergeFieldData, loading: mergeFieldsLoading } =
    useMailchimpMergeFieldsQuery({
      skip: !value.syncProviderId || !value.listId,
      variables: {
        configId: value.syncProviderId ?? '',
        listId: value.listId ?? '',
      },
    });

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
      <Panel
        bordered
        header={t('blocks.mailchimpForm.general')}
      >
        <Row>
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
          </Field>
        </Row>

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

        <Row>
          <ToggleRow>
            <Toggle
              disabled={disabled}
              checked={value.autoFocus}
              onChange={autoFocus => update({ autoFocus })}
            />
            <Label>{t('blocks.mailchimpForm.autoFocus')}</Label>
          </ToggleRow>

          <ToggleRow>
            <Toggle
              disabled={disabled}
              checked={value.doubleOptIn ?? false}
              onChange={doubleOptIn => update({ doubleOptIn })}
            />
            <Label>{t('blocks.mailchimpForm.doubleOptIn')}</Label>
          </ToggleRow>
        </Row>

        <Row>
          <Field>
            <Label>{t('blocks.mailchimpForm.submitButtonLabel')}</Label>
            <Input
              disabled={disabled}
              value={value.submitButtonLabel ?? ''}
              onChange={submitButtonLabel => update({ submitButtonLabel })}
            />
          </Field>
          <Row>
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
          </Row>
        </Row>
      </Panel>

      <Panel
        bordered
        header={t('blocks.mailchimpForm.steps')}
      >
        {value.steps.map((step, stepIndex) => {
          const updateStep = (patch: Partial<MailchimpFormStepValue>) =>
            update({
              steps: value.steps.map((s, i) =>
                i === stepIndex ? { ...s, ...patch } : s
              ),
            });

          return (
            <ItemPanel
              key={stepIndex}
              bordered
            >
              <ItemHeader>
                <Heading>
                  {t('blocks.mailchimpForm.step', { number: stepIndex + 1 })}
                </Heading>
                <IconButton
                  size="xs"
                  icon={<MdDelete />}
                  disabled={disabled}
                  onClick={() =>
                    update({
                      steps: value.steps.filter((_, i) => i !== stepIndex),
                    })
                  }
                />
              </ItemHeader>

              <Field>
                <Label>{t('blocks.mailchimpForm.skipIfFieldsFilled')}</Label>
                <TagPicker
                  block
                  creatable
                  disabled={disabled}
                  data={fieldNameOptions}
                  value={step.skipIfFieldsFilled}
                  onChange={skipIfFieldsFilled =>
                    updateStep({ skipIfFieldsFilled: skipIfFieldsFilled ?? [] })
                  }
                />
              </Field>

              <Row>
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
                        skipIfInterestsFilled: skipIfInterestsFilled ?? [],
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
                        showIfInterestsFilled: showIfInterestsFilled ?? [],
                      })
                    }
                  />
                </Field>
              </Row>

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

                const advancedKey = `${stepIndex}-${inputIndex}`;
                const showAdvanced = advancedInputs.has(advancedKey);

                return (
                  <ItemPanel
                    key={inputIndex}
                    bordered
                  >
                    <ItemHeader>
                      <Heading>{input.name || input.label || '—'}</Heading>
                      <IconButton
                        size="xs"
                        icon={<MdDelete />}
                        disabled={disabled}
                        onClick={() =>
                          updateStep({
                            inputs: step.inputs.filter(
                              (_, i) => i !== inputIndex
                            ),
                          })
                        }
                      />
                    </ItemHeader>

                    <Row>
                      <Field>
                        <Label>{t('blocks.mailchimpForm.inputType')}</Label>
                        <SelectPicker
                          block
                          cleanable={false}
                          searchable={false}
                          disabled={disabled}
                          data={INPUT_TYPES.map(type => ({
                            value: type,
                            label: type,
                          }))}
                          value={input.inputType ?? 'text'}
                          onChange={inputType => updateInput({ inputType })}
                        />
                        <HelpText>
                          {t('blocks.mailchimpForm.inputTypeHelp')}
                        </HelpText>
                      </Field>
                      <ToggleRow>
                        <Toggle
                          disabled={disabled}
                          checked={input.required ?? false}
                          onChange={required => updateInput({ required })}
                        />
                        <Label>{t('blocks.mailchimpForm.required')}</Label>
                      </ToggleRow>
                    </Row>

                    {input.inputType !== 'groups' && (
                      <Row>
                        <Field>
                          <Label>{t('blocks.mailchimpForm.inputName')}</Label>
                          <InputPicker
                            block
                            creatable
                            cleanable={false}
                            disabled={disabled}
                            loading={mergeFieldsLoading}
                            data={mergeFieldOptions}
                            value={input.name || null}
                            onChange={name => updateInput({ name: name ?? '' })}
                            placeholder={t(
                              'blocks.mailchimpForm.mergeFieldPlaceholder'
                            )}
                          />
                          <HelpText>
                            {t('blocks.mailchimpForm.inputNameHelp')}
                          </HelpText>
                        </Field>
                        <Field>
                          <Label>{t('blocks.mailchimpForm.inputLabel')}</Label>
                          <Input
                            disabled={disabled}
                            value={input.label ?? ''}
                            onChange={label => updateInput({ label })}
                          />
                          <HelpText>
                            {t('blocks.mailchimpForm.inputLabelHelp')}
                          </HelpText>
                        </Field>
                      </Row>
                    )}

                    <ToggleRow>
                      <Toggle
                        disabled={disabled}
                        checked={showAdvanced}
                        onChange={enabled =>
                          toggleAdvanced(advancedKey, enabled)
                        }
                      />
                      <Label>{t('blocks.mailchimpForm.advanced')}</Label>
                    </ToggleRow>

                    {showAdvanced && (
                      <Field>
                        <Label>
                          {t('blocks.mailchimpForm.inputDescription')}
                        </Label>
                        <Input
                          disabled={disabled}
                          value={input.description ?? ''}
                          onChange={description => updateInput({ description })}
                        />
                        <HelpText>
                          {t('blocks.mailchimpForm.inputDescriptionHelp')}
                        </HelpText>
                      </Field>
                    )}

                    {showAdvanced && input.inputType !== 'groups' && (
                      <Row>
                        <Field>
                          <Label>
                            {t('blocks.mailchimpForm.fieldUrlParam')}
                          </Label>
                          <Input
                            disabled={disabled}
                            value={input.urlParam ?? ''}
                            onChange={urlParam => updateInput({ urlParam })}
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
                            {t('blocks.mailchimpForm.fieldDefaultValueHelp')}
                          </HelpText>
                        </Field>
                        <Field>
                          <Label>{t('blocks.mailchimpForm.fieldValue')}</Label>
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
                      </Row>
                    )}

                    {input.inputType === 'groups' && (
                      <Field>
                        <Label>
                          {t('blocks.mailchimpForm.interestOptions')}
                        </Label>
                        {input.options.map((option, optionIndex) => (
                          <Row key={optionIndex}>
                            <SelectPicker
                              block
                              disabled={disabled}
                              data={interestOptions}
                              value={option.id || null}
                              onChange={(id, event) => {
                                const label = interestOptions.find(
                                  o => o.value === id
                                )?.label;
                                updateInput({
                                  options: input.options.map((o, i) =>
                                    i === optionIndex ?
                                      {
                                        ...o,
                                        id: id ?? '',
                                        name: label ?? o.name,
                                      }
                                    : o
                                  ),
                                });
                              }}
                              placeholder={t(
                                'blocks.mailchimpForm.interestOptionPlaceholder'
                              )}
                            />
                            <InputGroup>
                              <Input
                                disabled={disabled}
                                value={option.description ?? ''}
                                placeholder={t(
                                  'blocks.mailchimpForm.interestOptionDescription'
                                )}
                                onChange={description =>
                                  updateInput({
                                    options: input.options.map((o, i) =>
                                      i === optionIndex ?
                                        { ...o, description }
                                      : o
                                    ),
                                  })
                                }
                              />
                              <InputGroup.Button
                                disabled={disabled}
                                onClick={() =>
                                  updateInput({
                                    options: input.options.filter(
                                      (_, i) => i !== optionIndex
                                    ),
                                  })
                                }
                              >
                                <MdDelete />
                              </InputGroup.Button>
                            </InputGroup>
                          </Row>
                        ))}
                        <IconButton
                          size="xs"
                          icon={<MdAddCircle />}
                          disabled={disabled}
                          onClick={() =>
                            updateInput({
                              options: [
                                ...input.options,
                                { id: '', name: '', description: null },
                              ],
                            })
                          }
                        >
                          {t('blocks.mailchimpForm.addInterestOption')}
                        </IconButton>
                      </Field>
                    )}
                  </ItemPanel>
                );
              })}

              <IconButton
                size="xs"
                icon={<MdAddCircle />}
                disabled={disabled}
                onClick={() =>
                  updateStep({ inputs: [...step.inputs, emptyInput()] })
                }
              >
                {t('blocks.mailchimpForm.addInput')}
              </IconButton>
            </ItemPanel>
          );
        })}
        <IconButton
          icon={<MdAddCircle />}
          disabled={disabled}
          onClick={() => update({ steps: [...value.steps, emptyStep()] })}
        >
          {t('blocks.mailchimpForm.addStep')}
        </IconButton>
      </Panel>

      <Panel
        bordered
        header={t('blocks.mailchimpForm.success')}
      >
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
          <Toggle
            disabled={disabled}
            checked={!!value.successPage}
            onChange={enabled =>
              update({
                successPage: enabled ? { description: '', options: [] } : null,
                successUrl: enabled ? null : value.successUrl,
              })
            }
          />
          <Label>{t('blocks.mailchimpForm.useSuccessPage')}</Label>
        </ToggleRow>

        {value.successPage && (
          <ItemPanel bordered>
            <Field>
              <Label>{t('blocks.mailchimpForm.successPageDescription')}</Label>
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
                <ItemPanel
                  key={optionIndex}
                  bordered
                >
                  <ItemHeader>
                    <Heading>{option.label || '—'}</Heading>
                    <IconButton
                      size="xs"
                      icon={<MdDelete />}
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
                    />
                  </ItemHeader>
                  <Row>
                    <Field>
                      <Label>{t('blocks.mailchimpForm.optionLabel')}</Label>
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
                        onChange={background => updateOption({ background })}
                      />
                    </Field>
                  </Row>
                  <Field>
                    <Label>{t('blocks.mailchimpForm.optionUrl')}</Label>
                    <Input
                      disabled={disabled}
                      value={option.url}
                      onChange={url => updateOption({ url })}
                    />
                  </Field>
                  <Row>
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
                  </Row>
                </ItemPanel>
              );
            })}

            <IconButton
              size="xs"
              icon={<MdAddCircle />}
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
            </IconButton>
          </ItemPanel>
        )}
      </Panel>
    </div>
  );
}
