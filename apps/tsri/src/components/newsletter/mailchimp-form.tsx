import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, css, TextField, Theme, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Widget } from '@typeform/embed-react';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { BaseSyntheticEvent, FormEvent, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const formStyles = css`
  display: block;
  align-self: flex-end;
  padding: 24px 32px 32px 0;
  font-size: 16px;
  font-weight: 700;
`;

const PopTextComponent = styled('p')`
  font-size: 18px !important;
  font-weight: 700 !important;
`;

const RegisterMCNewsletterFormSchema = z.object({
  email: z.string().email().min(1),
  SOURCE: z.string().optional(),
});

const autofocus = (node: HTMLElement | null) => {
  const inputNode = node?.querySelector('input') ?? node;
  inputNode?.focus();
};

const typeFormStyles = (theme: Theme) => css`
  width: 100%;
  height: 100vh;

  ${theme.breakpoints.up('md')} {
    width: 1200px;
    height: 1000px;
  }
`;

export type MailchimpSubscribeFormProps = {
  mc_u: string;
  mc_id: string;
  mc_f_id: string;
  tf_id: string;
  source?: string;
  popButtonText?: string;
  popHeading?: string;
  popText?: string;
  onMCSubmit?: (e: FormEvent<HTMLFormElement>) => void;
};

export default function MailchimpSubscribeForm(
  props: MailchimpSubscribeFormProps
) {
  const {
    mc_u,
    mc_id,
    mc_f_id,
    tf_id,
    source,
    popButtonText,
    popHeading,
    popText,
    onMCSubmit,
  } = props;
  const [email, setEmail] = useState('');
  const [showTypeForm, setShowTypeForm] = useState(false);
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  type FormInput = z.infer<typeof RegisterMCNewsletterFormSchema>;

  const {
    blocks: { IFrame },
  } = useWebsiteBuilder();

  const mc_formActionBaseURL =
    'https://tsüri.us9.list-manage.com/subscribe/post';
  const mc_fetchBaseURL =
    'https://tsüri.us9.list-manage.com/subscribe/post-json';
  const tf_baseURL = 'https://tsueri.typeform.com/to';

  const { handleSubmit, control } = useForm<FormInput>({
    resolver: zodResolver(RegisterMCNewsletterFormSchema),
    defaultValues: {
      email: '',
      SOURCE: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const onSubmit = handleSubmit(
    (data: FormInput, event?: BaseSyntheticEvent<object, any, any>) => {
      event?.preventDefault();
      if (data?.email) {
        setEmail(data.email);
      }
      return processSubmit(event as FormEvent<HTMLFormElement>);
    }
  );

  const processSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.target as HTMLFormElement);
    fetch(`${mc_fetchBaseURL}?u=${mc_u}&id=${mc_id}&f_id=${mc_f_id}&c=?`, {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
    })
      .then(() => {
        onMCSubmit?.(event);
        setShowTypeForm(true);
      })
      .catch(error => {
        setShowTypeForm(false);
      });
  };

  return (
    <>
      {!showTypeForm && (
        <form
          action={`${mc_formActionBaseURL}?u=${mc_u}&id=${mc_id}&f_id=${mc_f_id}`}
          method="post"
          onSubmit={onSubmit}
          css={formStyles}
        >
          <Box
            maxWidth="sm"
            display={'flex'}
            flexDirection={'column'}
            gap={2}
          >
            {popText ?
              <Typography
                variant="body1"
                paragraph
                component={PopTextComponent}
              >
                {popText}
              </Typography>
            : null}

            <Controller
              name={'email'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  autoComplete="email"
                  type={'email'}
                  fullWidth
                  label={'Email'}
                  error={!!error}
                  helperText={error?.message}
                  inputRef={autofocus}
                />
              )}
            />

            <Controller
              name={'SOURCE'}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type={'hidden'}
                  value={source}
                  sx={{ visibility: 'hidden' }}
                />
              )}
            />

            <Box
              display={'flex'}
              flexDirection={'row'}
              alignItems={'end'}
              alignSelf={'end'}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{
                  paddingX: 4,
                  paddingY: 1,
                  fontSize: 16,
                  fontWeight: 700,
                  color: (theme: Theme) => theme.palette.common.white,
                  transition: 'none',
                  ':hover': {
                    color: (theme: Theme) => theme.palette.common.black,
                    backgroundColor: (theme: Theme) =>
                      theme.palette.primary.light,
                  },
                }}
              >
                {popButtonText ?? 'Abonnieren'}
              </Button>
            </Box>
          </Box>
        </form>
      )}
      {showTypeForm && (
        <Widget
          id={tf_id}
          css={typeFormStyles}
          autoFocus={false}
          iframeProps={{ id: 'typeform' }}
          inlineOnMobile={true}
          autoResize={!isDesktop}
          hidden={{ email }}
        />
      )}
    </>
  );
}
