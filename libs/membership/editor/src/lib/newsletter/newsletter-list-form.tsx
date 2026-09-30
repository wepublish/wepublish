import styled from '@emotion/styled';
import {
  MemberPlan,
  MutationCreateNewsletterListArgs,
  NewsletterListLockedDisplay,
} from '@wepublish/editor/api';
import { SelectMemberPlans } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Form, Input, Message, Panel, Radio, RadioGroup, Toggle } from 'rsuite';

export type NewsletterListFormData = MutationCreateNewsletterListArgs & {
  memberPlans?: Pick<MemberPlan, 'id' | 'name'>[];
};

type NewsletterListFormProps = {
  list: Partial<NewsletterListFormData>;
  onChange: (changes: Partial<NewsletterListFormData>) => void;
};

export const newsletterListAccessError = ({
  requiresSubscription,
  anyMemberPlan,
  memberPlanIds,
}: Partial<NewsletterListFormData>) =>
  requiresSubscription && !anyMemberPlan && !memberPlanIds?.length ?
    'newsletter.form.memberPlansRequired'
  : undefined;

export const toNewsletterListMutationArgs = ({
  name = '',
  slug = '',
  description,
  active,
  requiresSubscription,
  anyMemberPlan,
  autoSubscribe,
  lockedDisplay,
  lockedText,
  lockedLinkUrl,
  memberPlanIds,
}: Partial<NewsletterListFormData>): MutationCreateNewsletterListArgs => ({
  name,
  slug,
  description: description || null,
  active,
  requiresSubscription,
  anyMemberPlan,
  autoSubscribe,
  lockedDisplay,
  lockedText: lockedText || null,
  lockedLinkUrl: lockedLinkUrl || null,
  memberPlanIds,
});

const NewsletterListFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: 12px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const NewsletterListFormSection = styled.div`
  display: grid;
  align-items: start;
  gap: 12px;
`;

export const NewsletterListForm = ({
  list,
  onChange,
}: NewsletterListFormProps) => {
  const { t } = useTranslation();
  const accessError = newsletterListAccessError(list);

  return (
    <NewsletterListFormWrapper>
      <NewsletterListFormSection>
        <Panel
          bordered
          header={t('newsletter.form.general')}
        >
          <Form.Group controlId="active">
            <Form.Label>{t('newsletter.form.active')}</Form.Label>
            <Toggle
              id="active"
              checked={!!list.active}
              onChange={active => onChange({ active })}
            />
            <Form.HelpText>{t('newsletter.form.activeHelp')}</Form.HelpText>
          </Form.Group>

          <Form.Group controlId="name">
            <Form.Label>{t('newsletter.form.name')}</Form.Label>
            <Form.Control
              name="name"
              value={list.name ?? ''}
              onChange={(name: string) => onChange({ name })}
            />
          </Form.Group>

          <Form.Group controlId="slug">
            <Form.Label>{t('newsletter.form.slug')}</Form.Label>
            <Form.Control
              name="slug"
              value={list.slug ?? ''}
              onChange={(slug: string) => onChange({ slug })}
            />
          </Form.Group>

          <Form.Group controlId="description">
            <Form.Label>{t('newsletter.form.description')}</Form.Label>
            <Input
              id="description"
              as="textarea"
              rows={3}
              value={list.description ?? ''}
              onChange={description => onChange({ description })}
            />
          </Form.Group>
        </Panel>
      </NewsletterListFormSection>

      <NewsletterListFormSection>
        <Panel
          bordered
          header={t('newsletter.form.access')}
        >
          <Form.Group controlId="requiresSubscription">
            <Form.Label>{t('newsletter.form.requiresSubscription')}</Form.Label>
            <Toggle
              id="requiresSubscription"
              checked={!!list.requiresSubscription}
              onChange={requiresSubscription =>
                onChange({ requiresSubscription })
              }
            />
            <Form.HelpText>
              {t('newsletter.form.requiresSubscriptionHelp')}
            </Form.HelpText>
          </Form.Group>

          {list.requiresSubscription && (
            <>
              <Form.Group controlId="anyMemberPlan">
                <Form.Label>{t('newsletter.form.anyMemberPlan')}</Form.Label>
                <Toggle
                  id="anyMemberPlan"
                  checked={!!list.anyMemberPlan}
                  onChange={anyMemberPlan => onChange({ anyMemberPlan })}
                />
              </Form.Group>

              <Form.Group controlId="memberPlanIds">
                <Form.Label>{t('newsletter.form.memberPlans')}</Form.Label>
                <Form.Control
                  name="memberPlanIds"
                  disabled={!!list.anyMemberPlan}
                  defaultMemberPlans={list.memberPlans ?? []}
                  selectedMemberPlans={list.memberPlanIds ?? []}
                  setSelectedMemberPlans={(memberPlanIds: string[]) =>
                    onChange({ memberPlanIds })
                  }
                  accepter={SelectMemberPlans}
                />
              </Form.Group>

              {accessError && (
                <Message
                  type="error"
                  showIcon
                >
                  {t(accessError)}
                </Message>
              )}

              <Form.Group controlId="autoSubscribe">
                <Form.Label>{t('newsletter.form.autoSubscribe')}</Form.Label>
                <Toggle
                  id="autoSubscribe"
                  checked={!!list.autoSubscribe}
                  onChange={autoSubscribe => onChange({ autoSubscribe })}
                />
                <Form.HelpText>
                  {t('newsletter.form.autoSubscribeHelp')}
                </Form.HelpText>
              </Form.Group>
            </>
          )}
        </Panel>

        {list.requiresSubscription && (
          <Panel
            bordered
            header={t('newsletter.form.lockedDisplay')}
          >
            <Form.Group controlId="lockedDisplay">
              <Form.HelpText>
                {t('newsletter.form.lockedDisplayHelp')}
              </Form.HelpText>
              <RadioGroup
                name="lockedDisplay"
                value={list.lockedDisplay ?? NewsletterListLockedDisplay.Teaser}
                onChange={lockedDisplay =>
                  onChange({
                    lockedDisplay: lockedDisplay as NewsletterListLockedDisplay,
                  })
                }
              >
                <Radio value={NewsletterListLockedDisplay.Teaser}>
                  {t('newsletter.form.lockedDisplayTeaser')}
                </Radio>
                <Radio value={NewsletterListLockedDisplay.Hidden}>
                  {t('newsletter.form.lockedDisplayHidden')}
                </Radio>
              </RadioGroup>
            </Form.Group>

            {list.lockedDisplay !== NewsletterListLockedDisplay.Hidden && (
              <>
                <Form.Group controlId="lockedText">
                  <Form.Label>{t('newsletter.form.lockedText')}</Form.Label>
                  <Input
                    id="lockedText"
                    as="textarea"
                    rows={3}
                    value={list.lockedText ?? ''}
                    onChange={lockedText => onChange({ lockedText })}
                  />
                </Form.Group>

                <Form.Group controlId="lockedLinkUrl">
                  <Form.Label>{t('newsletter.form.lockedLinkUrl')}</Form.Label>
                  <Input
                    id="lockedLinkUrl"
                    value={list.lockedLinkUrl ?? ''}
                    placeholder={t('newsletter.form.lockedLinkUrlPlaceholder')}
                    onChange={lockedLinkUrl => onChange({ lockedLinkUrl })}
                  />
                </Form.Group>
              </>
            )}
          </Panel>
        )}
      </NewsletterListFormSection>
    </NewsletterListFormWrapper>
  );
};
