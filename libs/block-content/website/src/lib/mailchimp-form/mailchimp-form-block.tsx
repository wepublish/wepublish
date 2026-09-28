import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddMailchimpContactDocument,
  BlockContent,
  FullMailchimpFormBlockFragment,
  MailchimpContactStatus,
  MailchimpFormOptionsLayout,
} from '@wepublish/website/api';
import {
  BuilderMailchimpFormBlockProps,
  Image,
} from '@wepublish/website/builder';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const isMailchimpFormBlock = (
  block: Partial<Pick<BlockContent, '__typename'>>
): block is FullMailchimpFormBlockFragment =>
  block.__typename === 'MailchimpFormBlock';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Form = styled('form')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Actions = styled('div')`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Options = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const MailchimpFormOptions = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const MailchimpFormOptionItem = styled('label')`
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  cursor: pointer;
`;

export const MailchimpFormOptionItemImage = styled(Image)`
  width: 64px;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

export const MailchimpFormOptionGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const MailchimpFormOptionCard = styled('label')<{ isSelected: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid
    ${({ theme, isSelected }) =>
      isSelected ? theme.palette.primary.main : theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.palette.background.paper};

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 2px;
  }
`;

export const MailchimpFormOptionCardImage = styled(Image)`
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;

export const MailchimpFormOptionCardContent = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(6)};
`;

export const MailchimpFormOptionCardCheckbox = styled(Checkbox)`
  position: absolute;
  top: ${({ theme }) => theme.spacing(1)};
  right: ${({ theme }) => theme.spacing(1)};
  background-color: ${({ theme }) => theme.palette.background.paper};

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.paper};
  }
`;

type Step = FullMailchimpFormBlockFragment['steps'][number];
type InterestOption = Step['inputs'][number]['options'][number];

type MailchimpFormOptionSelectionProps = {
  options: InterestOption[];
  layout: MailchimpFormOptionsLayout;
  selected: string[];
  onChange: (id: string, checked: boolean) => void;
};

const MailchimpFormOptionSelection = ({
  options,
  layout,
  selected,
  onChange,
}: MailchimpFormOptionSelectionProps) => {
  if (layout === MailchimpFormOptionsLayout.Grid) {
    return (
      <MailchimpFormOptionGrid>
        {options.map(option => {
          const isSelected = selected.includes(option.id);

          return (
            <MailchimpFormOptionCard
              key={option.id}
              isSelected={isSelected}
            >
              {option.image && (
                <MailchimpFormOptionCardImage image={option.image} />
              )}

              <MailchimpFormOptionCardContent>
                <Typography variant="subtitle1">{option.name}</Typography>
                {option.description && (
                  <Typography variant="body2">{option.description}</Typography>
                )}
              </MailchimpFormOptionCardContent>

              <MailchimpFormOptionCardCheckbox
                checked={isSelected}
                onChange={event => onChange(option.id, event.target.checked)}
              />
            </MailchimpFormOptionCard>
          );
        })}
      </MailchimpFormOptionGrid>
    );
  }

  return (
    <MailchimpFormOptions>
      {options.map(option => (
        <MailchimpFormOptionItem key={option.id}>
          <Checkbox
            checked={selected.includes(option.id)}
            onChange={event => onChange(option.id, event.target.checked)}
          />

          {option.image ?
            <MailchimpFormOptionItemImage image={option.image} />
          : <span />}

          <div>
            <Typography variant="subtitle1">{option.name}</Typography>
            {option.description && (
              <Typography variant="body2">{option.description}</Typography>
            )}
          </div>
        </MailchimpFormOptionItem>
      ))}
    </MailchimpFormOptions>
  );
};

const getQueryParam = (name?: string | null): string | null => {
  if (!name || typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get(name);
};

const replacePlaceholders = (
  url: string,
  formData: Record<string, string>
): string =>
  url.replace(/\|\*(\w+)\*\|/g, (_, fieldName: string) => {
    const value = formData[fieldName.toUpperCase()];

    return value ? encodeURIComponent(value) : '';
  });

export const MailchimpFormBlock = ({
  className,
  syncProviderId,
  listId,
  interests: presetInterests,
  autoFocus,
  doubleOptIn,
  buttonColor,
  buttonFontColor,
  submitButtonLabel,
  steps,
  successUrl,
  successPage,
}: BuilderMailchimpFormBlockProps) => {
  const [addMailchimpContact] = useMutation(AddMailchimpContactDocument);
  const { t } = useTranslation();

  const allInputs = useMemo(
    () => steps.flatMap(step => step.inputs).filter(input => !!input.name),
    [steps]
  );

  const [formData, setFormData] = useState<Record<string, string>>(() =>
    allInputs.reduce<Record<string, string>>((acc, input) => {
      acc[input.name as string] =
        input.value ??
        getQueryParam(input.urlParam) ??
        input.defaultValue ??
        '';

      return acc;
    }, {})
  );

  const [interests, setInterests] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(current => {
      const next = { ...current };
      for (const input of allInputs) {
        const fromQuery = getQueryParam(input.urlParam);
        if (fromQuery) {
          next[input.name as string] = fromQuery;
        }
      }

      return next;
    });
  }, [allInputs]);

  const allInterests = useMemo(
    () => [...presetInterests, ...interests],
    [presetInterests, interests]
  );

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const shouldSkipStep = (step: Step): boolean => {
    if (step.showIfInterestsFilled.length) {
      return !step.showIfInterestsFilled.every(interest =>
        allInterests.includes(interest)
      );
    }

    if (step.skipIfFieldsFilled.length) {
      return step.skipIfFieldsFilled.every(field => formData[field]);
    }

    if (step.skipIfInterestsFilled.length) {
      return step.skipIfInterestsFilled.every(interest =>
        allInterests.includes(interest)
      );
    }

    return false;
  };

  const finish = () => {
    if (successPage) {
      setIsSubmitted(true);

      return;
    }

    if (successUrl) {
      window.location.href = replacePlaceholders(successUrl, formData);
    }
  };

  const goForward = () => {
    let nextStep = currentStep + 1;

    while (nextStep < steps.length && shouldSkipStep(steps[nextStep])) {
      nextStep++;
    }

    if (nextStep >= steps.length) {
      finish();

      return;
    }

    setCurrentStep(nextStep);
  };

  const goBack = () => {
    let prevStep = currentStep - 1;

    while (prevStep >= 0 && shouldSkipStep(steps[prevStep])) {
      prevStep--;
    }

    setCurrentStep(Math.max(0, prevStep));
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData(current => ({ ...current, [name]: value }));
  };

  const handleInterestChange = (id: string, checked: boolean) => {
    setInterests(current =>
      checked ? [...current, id] : current.filter(value => value !== id)
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!syncProviderId || !listId) {
      setError('Form is not configured.');

      return;
    }

    const hasMissingInterests = steps[currentStep].inputs.some(
      input =>
        input.inputType === 'groups' &&
        input.required &&
        !input.options.some(option => interests.includes(option.id))
    );

    if (hasMissingInterests) {
      setError(t('newsletter.noInterestSelected'));

      return;
    }

    setError(null);
    setIsSubmitting(true);

    const mergeFields = Object.fromEntries(
      Object.entries(formData)
        .filter(([key]) => key !== 'EMAIL')
        .map(([key, value]) => {
          if (!value) {
            const input = allInputs.find(field => field.name === key);

            return [key, input?.defaultValue ?? ''];
          }

          return [key, value];
        })
    );

    const interestsInput = Object.fromEntries(
      allInterests.map(interest => [interest, true])
    );

    try {
      const result = await addMailchimpContact({
        variables: {
          input: {
            syncProviderId,
            email: formData['EMAIL'],
            status:
              doubleOptIn ?
                MailchimpContactStatus.Pending
              : MailchimpContactStatus.Subscribed,
            listId,
            mergeFields,
            interests: interestsInput,
          },
        },
      });

      const data = result.data?.addMailchimpContact;

      if (!data?.success) {
        setError(data?.error ?? 'Unknown error');

        return;
      }
    } catch {
      setError('Unknown error');

      return;
    } finally {
      setIsSubmitting(false);
    }

    if (!isLastStep) {
      goForward();

      return;
    }

    finish();
  };

  if (isSubmitted && successPage) {
    return (
      <Wrapper className={className}>
        {successPage.description && (
          <Typography variant="body1">{successPage.description}</Typography>
        )}
        <Options>
          {successPage.options.map((option, index) => (
            <Button
              key={index}
              variant="contained"
              href={replacePlaceholders(option.url, formData)}
              style={{ backgroundColor: option.background }}
            >
              {option.label}
            </Button>
          ))}
        </Options>
      </Wrapper>
    );
  }

  if (!steps.length) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <Wrapper className={className}>
      <Form onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}

        {step.inputs.map((input, index) => {
          if (input.inputType === 'hidden') {
            return null;
          }

          if (input.inputType === 'groups') {
            return (
              <div key={`group-${index}`}>
                {input.label && (
                  <Typography variant="subtitle2">{input.label}</Typography>
                )}
                {input.description && (
                  <Typography variant="body2">{input.description}</Typography>
                )}
                <MailchimpFormOptionSelection
                  options={input.options}
                  layout={input.optionsLayout}
                  selected={interests}
                  onChange={handleInterestChange}
                />
              </div>
            );
          }

          return (
            <TextField
              key={input.name ?? index}
              type={input.inputType ?? 'text'}
              name={input.name ?? undefined}
              label={input.label}
              helperText={input.description}
              required={input.required ?? false}
              autoFocus={autoFocus && index === 0}
              value={input.name ? (formData[input.name] ?? '') : ''}
              onChange={event =>
                input.name && handleFieldChange(input.name, event.target.value)
              }
              fullWidth
            />
          );
        })}

        <Actions>
          {!isFirstStep && (
            <Button
              type="button"
              variant="outlined"
              disabled={isSubmitting}
              onClick={goBack}
            >
              {t('newsletter.back')}
            </Button>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            style={{
              backgroundColor: buttonColor ?? undefined,
              color: buttonFontColor ?? undefined,
              marginLeft: 'auto',
            }}
            endIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {isLastStep ?
              submitButtonLabel || t('newsletter.submit')
            : t('newsletter.next')}
          </Button>
        </Actions>
      </Form>
    </Wrapper>
  );
};
