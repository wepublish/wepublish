import styled from '@emotion/styled';
import {
  getApiClientV2,
  SeoMetadataContentType,
  useGenerateSeoMetadataLazyQuery,
} from '@wepublish/editor/api';
import { slugify } from '@wepublish/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAutoFixHigh } from 'react-icons/md';
import {
  Button,
  ButtonToolbar,
  Form,
  Input,
  Loader,
  Message,
  Panel,
} from 'rsuite';

export const SEO_SUGGESTION_FIELDS = [
  'seoTitle',
  'seoDescription',
  'socialMediaTitle',
  'socialMediaDescription',
  'slug',
] as const;

export type SeoSuggestionField = (typeof SEO_SUGGESTION_FIELDS)[number];

export type SeoSuggestionValues = Partial<
  Record<SeoSuggestionField, string | null | undefined>
>;

export type AppliedSeoSuggestions = Partial<Record<SeoSuggestionField, string>>;

export const SEO_SUGGESTION_LIMITS: Record<SeoSuggestionField, number> = {
  seoTitle: 70,
  seoDescription: 156,
  socialMediaTitle: 100,
  socialMediaDescription: 140,
  slug: 100,
};

const normalize = (field: SeoSuggestionField, value: string) =>
  field === 'slug' ? slugify(value) : value.trim();

export const applySeoSuggestions = (
  suggestions: SeoSuggestionValues,
  fields: readonly SeoSuggestionField[]
): AppliedSeoSuggestions =>
  fields.reduce<AppliedSeoSuggestions>((applied, field) => {
    const suggestion = normalize(field, suggestions[field] ?? '');

    if (suggestion) {
      applied[field] = suggestion;
    }

    return applied;
  }, {});

export const getEmptySuggestionFields = (
  current: SeoSuggestionValues,
  suggestions: SeoSuggestionValues
) =>
  SEO_SUGGESTION_FIELDS.filter(
    field => !current[field]?.trim() && !!suggestions[field]?.trim()
  );

const Suggestion = styled.div`
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
`;

const SuggestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const Current = styled.small`
  color: var(--rs-text-secondary, #8e8e93);
  overflow-wrap: anywhere;
`;

const CharCount = styled.small`
  color: var(--rs-text-secondary, #8e8e93);
`;

const CharCountExceeded = styled(CharCount)`
  color: var(--rs-red-500, red);
`;

export interface SeoSuggestionsProps {
  readonly type: SeoMetadataContentType;
  readonly context: {
    readonly title?: string | null;
    readonly lead?: string | null;
    readonly body?: string | null;
  };
  readonly value: SeoSuggestionValues;
  readonly disabled?: boolean;

  onApply(values: AppliedSeoSuggestions): void;
}

export function SeoSuggestions({
  type,
  context,
  value,
  disabled,
  onApply,
}: SeoSuggestionsProps) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<SeoSuggestionValues | null>(
    null
  );

  const [generate, { loading, error }] = useGenerateSeoMetadataLazyQuery({
    fetchPolicy: 'no-cache',
    client: getApiClientV2(),
  });

  const hasContent = [context.title, context.lead, context.body].some(text =>
    text?.trim()
  );

  const onGenerate = async () => {
    const result = await generate({
      variables: {
        input: {
          type,
          title: context.title,
          lead: context.lead,
          body: context.body,
        },
      },
    });

    if (!result.error && result.data) {
      const {
        seoTitle,
        seoDescription,
        socialMediaTitle,
        socialMediaDescription,
        slug,
      } = result.data.generateSeoMetadata;

      setSuggestions({
        seoTitle,
        seoDescription,
        socialMediaTitle,
        socialMediaDescription,
        slug,
      });
    }
  };

  const apply = (fields: readonly SeoSuggestionField[]) => {
    if (!suggestions) {
      return;
    }

    const applied = applySeoSuggestions(suggestions, fields);

    if (Object.keys(applied).length) {
      onApply(applied);
    }
  };

  const suggestedFields = SEO_SUGGESTION_FIELDS.filter(
    field => suggestions?.[field] !== undefined && suggestions?.[field] !== null
  );
  const emptyFields =
    suggestions ? getEmptySuggestionFields(value, suggestions) : [];

  return (
    <Panel
      bordered
      header={t('seoSuggestions.title')}
    >
      <Form.Text>{t('seoSuggestions.description')}</Form.Text>

      <ButtonToolbar>
        <Button
          startIcon={loading ? <Loader size="xs" /> : <MdAutoFixHigh />}
          disabled={disabled || loading || !hasContent}
          onClick={onGenerate}
        >
          {suggestions ?
            t('seoSuggestions.regenerate')
          : t('seoSuggestions.generate')}
        </Button>
      </ButtonToolbar>

      {!hasContent && (
        <Form.Text>{t('seoSuggestions.notEnoughContent')}</Form.Text>
      )}

      {error && (
        <Message
          showIcon
          type="error"
        >
          {error.message}
        </Message>
      )}

      {suggestions && (
        <>
          <Message
            showIcon
            type="info"
          >
            {t('seoSuggestions.review')}
          </Message>

          <br />

          {suggestedFields.map(field => {
            const suggestion = suggestions[field] ?? '';
            const current = value[field] ?? '';
            const isApplied = normalize(field, suggestion) === current;

            return (
              <Suggestion
                key={field}
                data-testid={`seo-suggestion-${field}`}
              >
                <SuggestionHeader>
                  <Form.Label>{t(`seoSuggestions.fields.${field}`)}</Form.Label>

                  {suggestion.length > SEO_SUGGESTION_LIMITS[field] ?
                    <CharCountExceeded>
                      {suggestion.length}/{SEO_SUGGESTION_LIMITS[field]}
                    </CharCountExceeded>
                  : <CharCount>
                      {suggestion.length}/{SEO_SUGGESTION_LIMITS[field]}
                    </CharCount>
                  }
                </SuggestionHeader>

                {field.endsWith('Description') ?
                  <Input
                    as="textarea"
                    rows={3}
                    aria-label={t(`seoSuggestions.fields.${field}`)}
                    value={suggestion}
                    onChange={next =>
                      setSuggestions(prev => ({ ...prev, [field]: next }))
                    }
                  />
                : <Input
                    aria-label={t(`seoSuggestions.fields.${field}`)}
                    value={suggestion}
                    onChange={next =>
                      setSuggestions(prev => ({ ...prev, [field]: next }))
                    }
                  />
                }

                <SuggestionHeader>
                  <Current>
                    {t('seoSuggestions.current')}:{' '}
                    {current || t('seoSuggestions.empty')}
                  </Current>

                  <Button
                    size="sm"
                    appearance="ghost"
                    disabled={disabled || isApplied || !suggestion.trim()}
                    onClick={() => apply([field])}
                  >
                    {isApplied ?
                      t('seoSuggestions.applied')
                    : current ?
                      t('seoSuggestions.replace')
                    : t('seoSuggestions.apply')}
                  </Button>
                </SuggestionHeader>
              </Suggestion>
            );
          })}

          <ButtonToolbar>
            <Button
              appearance="primary"
              disabled={disabled || !emptyFields.length}
              onClick={() => apply(emptyFields)}
            >
              {t('seoSuggestions.applyToEmpty')}
            </Button>

            <Button
              appearance="subtle"
              onClick={() => setSuggestions(null)}
            >
              {t('seoSuggestions.discard')}
            </Button>
          </ButtonToolbar>
        </>
      )}
    </Panel>
  );
}
