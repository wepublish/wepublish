import styled from '@emotion/styled';
import {
  FullImageFragment,
  FullPaymentMethodFragment,
  FullPaymentProviderFragment,
  useCreatePaymentMethodMutation,
  usePaymentMethodQuery,
  usePaymentProviderListQuery,
  useUpdatePaymentMethodMutation,
} from '@wepublish/editor/api';
import { slugify } from '@wepublish/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Drawer,
  Form as RForm,
  InputNumber,
  Message,
  Panel,
  Schema,
  SelectPicker,
  toaster,
  Toggle,
} from 'rsuite';

import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import { toggleRequiredLabel } from '../toggleRequiredLabel';
import { ImageSelectPanel } from './imageSelectPanel';

export interface PaymentMethodEditPanelProps {
  id?: string;

  onClose?(): void;
  onSave?(paymentMethod: FullPaymentMethodFragment): void;
}

const Form = styled(RForm)`
  height: 100%;
`;

const FormGroupWithPadding = styled(RForm.Group)`
  padding-top: 16px;
`;

function PaymentMethodEditPanel({
  id,
  onClose,
  onSave,
}: PaymentMethodEditPanelProps) {
  const { t } = useTranslation();

  const isAuthorized = useAuthorisation('CAN_CREATE_PAYMENT_METHOD');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState<boolean>(true);
  const [gracePeriod, setGracePeriod] = useState<number>(0);
  const [paymentProvider, setPaymentProvider] =
    useState<FullPaymentProviderFragment>();
  const [paymentProviders, setPaymentProviders] = useState<
    FullPaymentProviderFragment[]
  >([]);

  const [imageSelectionOpen, setImageSelectionOpen] = useState(false);
  const [image, setImage] = useState<FullImageFragment>();

  const {
    data,
    loading: isLoading,
    error: loadError,
  } = usePaymentMethodQuery({
    variables: { id: id! },
    skip: id === undefined,
  });

  const {
    data: paymentProviderData,
    loading: isLoadingPaymentProvider,
    error: loadPaymentProviderError,
  } = usePaymentProviderListQuery({});

  const [createPaymentMethod, { loading: isCreating, error: createError }] =
    useCreatePaymentMethodMutation();

  const [updatePaymentMethod, { loading: isUpdating, error: updateError }] =
    useUpdatePaymentMethodMutation();

  const isDisabled =
    isLoading ||
    isCreating ||
    isUpdating ||
    isLoadingPaymentProvider ||
    loadError !== undefined ||
    loadPaymentProviderError !== undefined ||
    !isAuthorized;

  useEffect(() => {
    if (data?.paymentMethod) {
      setName(data.paymentMethod.name);
      setSlug(data.paymentMethod.slug);
      setDescription(data.paymentMethod.description);
      setActive(data.paymentMethod.active);
      setPaymentProvider(data.paymentMethod.paymentProvider ?? undefined);
      setImage(data.paymentMethod.image ?? undefined);
      setGracePeriod(data.paymentMethod.gracePeriod);
    }
  }, [data?.paymentMethod]);

  useEffect(() => {
    if (paymentProviderData?.paymentProviders) {
      setPaymentProviders(paymentProviderData.paymentProviders);
    }
  }, [paymentProviderData?.paymentProviders]);

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      loadPaymentProviderError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
  }, [loadError, createError, updateError, loadPaymentProviderError]);

  async function handleSave() {
    if (!paymentProvider) {
      return; // TODO: handle validation
    }

    if (id) {
      const { data } = await updatePaymentMethod({
        variables: {
          id,
          name,
          slug,
          description,
          active,
          gracePeriod,
          paymentProviderID: paymentProvider.id,
          imageId: image?.id,
        },
      });

      if (data?.updatePaymentMethod) {
        onSave?.(data.updatePaymentMethod);
      }
    } else {
      const { data } = await createPaymentMethod({
        variables: {
          name,
          slug,
          description,
          active,
          gracePeriod,
          paymentProviderID: paymentProvider.id,
        },
      });

      if (data?.createPaymentMethod) {
        onSave?.(data.createPaymentMethod);
      }
    }
  }

  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    paymentProvider: StringType().isRequired(
      t('errorMessages.noPaymentProviderErrorMessage')
    ),
  });

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        fluid
        model={validationModel}
        formValue={{ name, paymentProvider }}
      >
        <Drawer.Header>
          <Drawer.Title>
            {id ?
              t('paymentMethodList.editTitle')
            : t('paymentMethodList.createTitle')}
          </Drawer.Title>

          <Drawer.Actions>
            <PermissionControl
              qualifyingPermissions={['CAN_CREATE_PAYMENT_METHOD']}
            >
              <Button
                appearance="primary"
                disabled={isDisabled}
                type="submit"
                onClick={() => handleSave()}
              >
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>

            <Button
              appearance={'subtle'}
              onClick={() => onClose?.()}
            >
              {t('close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <Panel>
            <RForm.Group controlId="imageId">
              <ChooseEditImage
                image={image}
                disabled={false}
                openChooseModalOpen={() => setImageSelectionOpen(true)}
                removeImage={() => setImage(undefined)}
                header={t('paymentMethodList.selectImage')}
                maxHeight={200}
              />
            </RForm.Group>

            <RForm.Group controlId="paymentMethodName">
              <RForm.ControlLabel>
                {toggleRequiredLabel(t('paymentMethodList.name'))}
              </RForm.ControlLabel>

              <RForm.Control
                name="name"
                value={name}
                disabled={isDisabled}
                onChange={(value: string) => {
                  setName(value);
                  setSlug(slugify(value));
                }}
              />
            </RForm.Group>

            <RForm.Group controlId="paymentMethodSlug">
              <RForm.ControlLabel>
                {t('paymentMethodList.slug')}
              </RForm.ControlLabel>

              <RForm.Control
                name={t('paymentMethodList.slug')}
                value={slug}
                plaintext
              />
            </RForm.Group>

            <RForm.Group controlId="paymentMethodIsActive">
              <RForm.ControlLabel>
                {t('paymentMethodList.active')}
              </RForm.ControlLabel>

              <Toggle
                checked={active}
                disabled={isDisabled}
                onChange={value => setActive(value)}
              />

              <RForm.HelpText>
                {t('paymentMethodList.activeDescription')}
              </RForm.HelpText>
            </RForm.Group>

            <RForm.Group controlId="paymentMethodAdapter">
              <RForm.ControlLabel>
                {toggleRequiredLabel(t('paymentMethodList.adapter'))}
              </RForm.ControlLabel>

              <RForm.Control
                name="paymentProvider"
                virtualized
                disabled={isDisabled}
                value={paymentProvider?.id}
                data={paymentProviders.map(pp => ({
                  value: pp.id,
                  label: pp.name,
                }))}
                searchable={false}
                block
                accepter={SelectPicker}
                onChange={(value: any) =>
                  setPaymentProvider(
                    paymentProviders.find(pp => pp.id === value)
                  )
                }
              />
            </RForm.Group>

            <RForm.Group controlId="paymentMethodDescription">
              <RForm.ControlLabel>
                {t('paymentMethodList.description')}
              </RForm.ControlLabel>

              <RForm.Control
                name="description"
                value={description}
                disabled={isDisabled}
                onChange={(value: string) => {
                  setDescription(value);
                }}
              />

              <FormGroupWithPadding controlId="paymentMethodGracePeriod">
                <RForm.ControlLabel>
                  {t('paymentMethodEditPanel.gracePeriod')}
                </RForm.ControlLabel>

                <InputNumber
                  name="gracePeriod"
                  value={gracePeriod}
                  disabled={isDisabled}
                  postfix={t('paymentMethodEditPanel.days')}
                  onChange={(value: string | number) => {
                    setGracePeriod(
                      typeof value === 'string' ? Number(value) : value
                    );
                  }}
                />

                <RForm.HelpText>
                  {t('paymentMethodEditPanel.gracePeriodHelpText')}
                </RForm.HelpText>
              </FormGroupWithPadding>
            </RForm.Group>
          </Panel>
        </Drawer.Body>
      </Form>

      <Drawer
        open={imageSelectionOpen}
        onClose={() => {
          setImageSelectionOpen(false);
        }}
      >
        <ImageSelectPanel
          onClose={() => setImageSelectionOpen(false)}
          onSelect={(image: FullImageFragment) => {
            setImage(image);
            setImageSelectionOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAYMENT_METHOD',
  'CAN_GET_PAYMENT_METHODS',
  'CAN_CREATE_PAYMENT_METHOD',
  'CAN_DELETE_PAYMENT_METHOD',
])(PaymentMethodEditPanel);
export { CheckedPermissionComponent as PaymentMethodEditPanel };
