import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, Box, TextField } from '@mui/material';
import {
  BuilderChallengeRef,
  Challenge,
  useSetIntendedRoute,
  useUser,
} from '@wepublish/authentication/website';
import {
  ChallengeDocument,
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
import { FormEvent, useEffect, useRef, useState } from 'react';
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
 * A newsletter signup right in the prompt: a newsletter wall, or a newsletter
 * action without a url. It only asks for the email (and readers who are not
 * logged in to solve the challenge). Once the API signed it up, the token goes
 * into a cookie, which views the article again: past a wall, and newsletter
 * prompts no longer show.
 */
const NewsletterSignupForm = ({
  submitLabel,
  onSignedUp,
}: {
  submitLabel: string;
  onSignedUp?: () => void;
}) => {
  const { t } = useTranslation();
  const { user, hasUser } = useUser();
  const challenge = useQuery(ChallengeDocument, { skip: hasUser });
  const challengeRef = useRef<BuilderChallengeRef>(null);
  const [solution, setSolution] = useState('');
  const challengeID = challenge.data?.challenge.challengeID;
  const {
    elements: { Button },
  } = useWebsiteBuilder();
  // The account's email until the reader types their own.
  const [typed, setEmail] = useState<string>();
  const email = typed ?? user?.email ?? '';
  const [signUp, { loading, error }] = useMutation(SignUpForNewsletterDocument);
  // Signed up: the article is viewed again, no second signup meanwhile.
  const [signedUp, setSignedUp] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const { data } = await signUp({
        variables: {
          email,
          ...(!hasUser && {
            challengeAnswer: {
              challengeID: challengeID ?? '',
              challengeSolution: solution,
            },
          }),
        },
      });

      if (data) {
        setSignedUp(true);
        onSignedUp?.();
        storeNewsletterToken(data.signUpForNewsletter.newsletterToken);
      }
    } catch {
      // Shown below, the reader can try again with a fresh challenge.
      setSolution('');
      challengeRef.current?.reset();
      challenge.refetch().catch(() => undefined);
    }
  };

  if (signedUp) {
    return (
      <Alert severity="success">{t('engagement.newsletterWall.done')}</Alert>
    );
  }

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
        disabled={loading || !email.trim() || (!hasUser && !solution)}
      >
        {submitLabel}
      </Button>

      {challenge.data?.challenge && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Challenge
            challengeRef={challengeRef}
            challenge={challenge.data.challenge}
            value={solution}
            onChange={setSolution as never}
            label={t('engagement.newsletterWall.captcha')}
          />
        </Box>
      )}

      {(error ?? challenge.error) && (
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
  const visible = stage.actions.filter(
    action => !(hasUser && action.type === EngagementActionType.Login)
  );
  // A newsletter action without a url asks for the email right here.
  const signupAction = visible.find(
    action => action.type === EngagementActionType.Newsletter && !action.url
  );
  const isWall =
    stage.enforcement === EngagementEnforcement.Hard &&
    stage.requirement === EngagementRequirement.Newsletter;
  const actions = visible.filter(action => action !== signupAction);
  const links = actions.filter(
    ({ role }) => role !== EngagementActionRole.Cancel
  );
  const primary =
    links.find(({ role }) => role === EngagementActionRole.Primary) ?? links[0];

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

  // A modal names itself by the title (or else the call to action), so that
  // is left out of its body.
  const modalTitle = stage.title ?? stage.cta ?? '';
  const content = (inModal: boolean) => (
    <>
      {stage.image?.url && (
        <EngagementPromptImage
          src={stage.image.url}
          alt={stage.image.description ?? ''}
        />
      )}
      {!inModal && stage.title && <H4 component="p">{stage.title}</H4>}
      {stage.description && <RichText richText={stage.description} />}
      {stage.text && <Paragraph>{stage.text}</Paragraph>}
      {stage.html && <div dangerouslySetInnerHTML={{ __html: stage.html }} />}
      {stage.cta && !(inModal && modalTitle === stage.cta) && (
        <Paragraph gutterBottom={false}>{stage.cta}</Paragraph>
      )}
      {(isWall || signupAction) && (
        <NewsletterSignupForm
          submitLabel={
            signupAction ?
              actionLabel(signupAction, t)
            : t('engagement.newsletterWall.submit')
          }
          onSignedUp={signupAction && (() => onAction?.(signupAction))}
        />
      )}
    </>
  );

  if (stage.placement === EngagementPlacement.Modal) {
    return (
      <Modal
        className={className}
        open={!delayed && !closed}
        title={modalTitle}
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
        {content(true)}
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
      {content(false)}

      <EngagementPromptActions>
        {actions.map(action =>
          action.role === EngagementActionRole.Cancel ?
            <Button
              key={action.id}
              variant="text"
              color="secondary"
              data-role={action.role}
              onClick={() => {
                onAction?.(action);
                dismiss();
              }}
            >
              {actionLabel(action, t)}
            </Button>
          : <Button
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
        )}

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
