import { zodResolver } from '@hookform/resolvers/zod';
import {
  BuilderChallengeRef,
  Challenge,
  UserFormWrapper,
  useUser,
} from '@wepublish/authentication/website';
import { ApiAlert } from '@wepublish/errors/website';
import {
  BuilderGiftCodeRedeemProps,
  BuilderRouterContext,
  BuilderUserFormFields,
  Link,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useContext, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  SubscribeButton,
  SubscribeNarrowSection,
  SubscribeSection,
  SubscribeWrapper,
} from '../subscribe/subscribe';
import {
  toRegisterVariables,
  useGiftCodeFormSchema,
} from './gift-code-register-schema';

export const giftCodeRedeemSchema = z.object({
  code: z.string().trim().min(1),
});

export const GiftCodeRedeem = <
  T extends Exclude<BuilderUserFormFields, 'flair'>,
>({
  challenge,
  redemption,
  onRedeem,
  onRedeemWithRegister,
  fields = ['firstName', 'password', 'passwordRepeated'] as T[],
  schema,
  className,
}: BuilderGiftCodeRedeemProps<T>) => {
  const {
    elements: { Alert, H5, TextField },
    UserForm,
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { hasUser } = useUser();
  const { asPath } = useContext(BuilderRouterContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);
  const challengeRef = useRef<BuilderChallengeRef>(null);

  const formSchema = useGiftCodeFormSchema(
    giftCodeRedeemSchema,
    hasUser,
    fields,
    schema
  );

  const { control, handleSubmit, setValue } = useForm<Record<string, any>>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: '' },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (challenge.data?.challenge.challengeID) {
      setValue(
        'challengeAnswer.challengeID',
        challenge.data.challenge.challengeID
      );
    }
  }, [challenge, setValue]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) =>
    handleSubmit(data => {
      challengeRef.current?.reset();
      const code = data.code.trim();

      if (hasUser) {
        return callAction(onRedeem)(code);
      }

      return callAction(onRedeemWithRegister)({
        code,
        register: toRegisterVariables(data),
      });
    })(event);

  if (redemption) {
    return (
      <Alert
        className={className}
        severity="success"
      >
        {t(`giftCode.redeem.success.${redemption.action}`, {
          memberPlan: redemption.subscription.memberPlan.name,
        })}
      </Alert>
    );
  }

  return (
    <SubscribeWrapper
      className={className}
      onSubmit={onSubmit}
      noValidate
    >
      <SubscribeSection area="code">
        <UserFormWrapper>
          <Controller
            name="code"
            control={control}
            render={({ field, fieldState: { error: fieldError } }) => (
              <TextField
                {...field}
                label={t('giftCode.redeem.code')}
                autoComplete="off"
                error={!!fieldError}
                helperText={fieldError?.message}
              />
            )}
          />
        </UserFormWrapper>
      </SubscribeSection>

      {!hasUser && (
        <SubscribeSection area="userForm">
          <Link href={`/login?intended=${encodeURIComponent(asPath ?? '')}`}>
            {t('giftCode.redeem.loginLink')}
          </Link>

          <UserForm
            control={control}
            fields={fields}
          />
        </SubscribeSection>
      )}

      {!hasUser && (
        <SubscribeSection area="challenge">
          <H5 component="h2">{t('subscribe.spamProtection')}</H5>

          {challenge.data?.challenge && (
            <Controller
              name={'challengeAnswer.challengeSolution'}
              control={control}
              render={({ field, fieldState: { error: fieldError } }) => (
                <Challenge
                  {...field}
                  challengeRef={challengeRef}
                  value={field.value || ''}
                  onChange={field.onChange}
                  challenge={challenge.data!.challenge}
                  label={t('subscribe.captcha')}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                />
              )}
            />
          )}

          {challenge.error && (
            <ApiAlert
              error={challenge.error}
              severity="error"
            />
          )}
        </SubscribeSection>
      )}

      {error && (
        <ApiAlert
          error={error}
          severity="error"
        />
      )}

      <SubscribeNarrowSection area="submit">
        <SubscribeButton
          type="submit"
          size="large"
          disabled={loading || challenge.loading}
        >
          {t('giftCode.redeem.submit')}
        </SubscribeButton>
      </SubscribeNarrowSection>
    </SubscribeWrapper>
  );
};
