import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, TextField } from '@mui/material';
import {
  useSetIntendedRoute,
  useUser,
} from '@wepublish/authentication/website';
import {
  EngagementActionRole,
  EngagementActionType,
  EngagementEnforcement,
  EngagementPlacement,
  EngagementRequirement,
  FullEngagementActionFragment,
  SignUpForNewsletterDocument,
} from '@wepublish/website/api';
import {
  BuilderEngagementPromptProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { actionHref, actionLabel, returnsToArticle } from './engagement-action';
import { storeNewsletterToken } from './newsletter-signup';

export const EngagementPromptWrapper = styled('section')`
  display: grid !important; // also after the hidden blocks of a paywall
  gap: ${({ theme }) => theme.spacing(3)};
  background-color: ${({ theme }) => theme.palette.accent.light};
  color: ${({ theme }) => theme.palette.accent.contrastText};
  padding: ${({ theme }) => theme.spacing(4)};
`;

export const EngagementPromptImage = styled('img')`
  max-width: 100%;
  height: auto;
`;

export const EngagementPromptActions = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: ${({ theme }) => theme.spacing(3)};
  row-gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-auto-flow: column;
    grid-auto-columns: max-content;
  }
`;

export const NewsletterWallForm = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: 1fr max-content;
    align-items: start;
  }
`;

/**
 * A newsletter wall only asks for the email. Once the API signed it up, the
 * token goes into a cookie, which views the article again: past the wall.
 */
const NewsletterWall = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const {
    elements: { Button },
  } = useWebsiteBuilder();
  // The account's email until the reader types their own.
  const [typed, setEmail] = useState<string>();
  const email = typed ?? user?.email ?? '';
  const [signUp, { loading, error }] = useMutation(SignUpForNewsletterDocument);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const { data } = await signUp({ variables: { email } });

      if (data) {
        storeNewsletterToken(data.signUpForNewsletter.newsletterToken);
      }
    } catch {
      // Shown below, the reader can try again.
    }
  };

  return (
    <NewsletterWallForm onSubmit={submit}>
      <TextField
        type="email"
        name="email"
        autoComplete="email"
        label={t('engagement.newsletterWall.email')}
        value={email}
        onChange={event => setEmail(event.target.value)}
        fullWidth
      />

      <Button
        type="submit"
        variant="contained"
        color="secondary"
        disabled={loading || !email.trim()}
      >
        {t('engagement.newsletterWall.submit')}
      </Button>

      {error && (
        <Alert
          severity="error"
          sx={{ gridColumn: '1 / -1' }}
        >
          {t('engagement.newsletterWall.error')}
        </Alert>
      )}
    </NewsletterWallForm>
  );
};

export const EngagementPrompt = ({
  className,
  prompt,
  onDismiss,
  onAction,
}: BuilderEngagementPromptProps) => {
  const { t } = useTranslation();
  const { hasUser } = useUser();
  const setIntendedRoute = useSetIntendedRoute();
  const {
    elements: { Button, Link, Modal, H4, Paragraph },
    blocks: { RichText },
  } = useWebsiteBuilder();
  const { stage } = prompt;
  const [closed, setClosed] = useState(false);
  const [delayed, setDelayed] = useState(stage.delaySeconds > 0);

  useEffect(() => {
    if (!stage.delaySeconds) {
      return;
    }

    const timer = setTimeout(
      () => setDelayed(false),
      stage.delaySeconds * 1000
    );

    return () => clearTimeout(timer);
  }, [stage.delaySeconds]);

  // Logged-in readers need no login button.
  const actions = stage.actions.filter(
    action => !(hasUser && action.type === EngagementActionType.Login)
  );
  const primary =
    actions.find(({ role }) => role === EngagementActionRole.Primary) ??
    actions[0];

  const follow = (action: FullEngagementActionFragment) => {
    onAction?.(action);

    if (returnsToArticle(action)) {
      setIntendedRoute();
    }
  };

  const dismiss = () => {
    setClosed(true);
    onDismiss?.();
  };

  // A modal names itself by the title, so it is left out of the body there.
  const content = (withTitle: boolean) => (
    <>
      {stage.image?.url && (
        <EngagementPromptImage
          src={stage.image.url}
          alt={stage.image.description ?? ''}
        />
      )}
      {withTitle && stage.title && <H4 component="p">{stage.title}</H4>}
      {stage.description && <RichText richText={stage.description} />}
      {stage.text && <Paragraph>{stage.text}</Paragraph>}
      {stage.html && <div dangerouslySetInnerHTML={{ __html: stage.html }} />}
      {stage.cta && <Paragraph gutterBottom={false}>{stage.cta}</Paragraph>}
    </>
  );

  if (stage.placement === EngagementPlacement.Modal) {
    return (
      <Modal
        className={className}
        open={!delayed && !closed}
        title={stage.title ?? ''}
        submitText={primary ? actionLabel(primary, t) : t('engagement.dismiss')}
        cancelText={t('engagement.dismiss')}
        onCancel={dismiss}
        onSubmit={() => {
          if (!primary) {
            return dismiss();
          }

          follow(primary);
          window.location.assign(actionHref(primary));
        }}
      >
        {content(false)}
      </Modal>
    );
  }

  if (delayed || closed) {
    return null;
  }

  return (
    <EngagementPromptWrapper
      className={className}
      data-placement={stage.placement}
      data-enforcement={stage.enforcement}
    >
      {content(true)}

      {stage.enforcement === EngagementEnforcement.Hard &&
        stage.requirement === EngagementRequirement.Newsletter && (
          <NewsletterWall />
        )}

      <EngagementPromptActions>
        {actions.map(action => (
          <Button
            key={action.id}
            variant={action === primary ? 'contained' : 'outlined'}
            color="secondary"
            data-role={action.role}
            LinkComponent={Link}
            href={actionHref(action)}
            onClick={() => follow(action)}
          >
            {actionLabel(action, t)}
          </Button>
        ))}

        {onDismiss && stage.placement !== EngagementPlacement.Cutoff && (
          <Button
            variant="text"
            color="secondary"
            onClick={dismiss}
          >
            {t('engagement.dismiss')}
          </Button>
        )}
      </EngagementPromptActions>
    </EngagementPromptWrapper>
  );
};
