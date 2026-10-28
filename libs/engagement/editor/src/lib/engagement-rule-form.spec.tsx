import { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TFunction } from 'i18next';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRulesDocument,
  FullEngagementRuleFragment,
  NewsletterReferralMode,
} from '@wepublish/editor/api';
import { EngagementRuleForm } from './engagement-rule-form';
import {
  EngagementRuleValues,
  SHOW_FIRST_PRIORITY,
  createEngagementRuleSchema,
} from './engagement-rule-values';
import { ENGAGEMENT_PRESETS } from './presets';

const t = ((key: string) => key) as unknown as TFunction;

const competing: FullEngagementRuleFragment = {
  __typename: 'EngagementRule',
  id: 'rule-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Crowdfunding',
  goal: EngagementGoal.Announcement,
  active: true,
  priority: 0,
  version: 1,
  audience: EngagementAudience.All,
  audienceMemberPlanIds: [],
  showOnArticles: true,
  showOnPageIds: [],
  includePeeredArticles: false,
  meterWindowDays: null,
  newsletterReferral: NewsletterReferralMode.None,
  newsletterReferralLimit: 0,
  newsletterParams: [],
  stages: [
    {
      __typename: 'EngagementStage',
      id: 'stage-1',
      afterArticles: 0,
      placement: EngagementPlacement.Banner,
      enforcement: EngagementEnforcement.Soft,
      requirement: null,
      previewBlocks: null,
      dismissible: true,
      hideForMinutes: 1440,
      delaySeconds: 0,
      title: 'Help us',
      text: null,
      cta: null,
      description: null,
      html: null,
      embedUrl: null,
      imageId: null,
      image: null,
      actions: [
        {
          __typename: 'EngagementAction',
          id: 'action-1',
          type: EngagementActionType.Url,
          label: 'Give',
          url: 'https://example.com',
          style: '',
          role: EngagementActionRole.Primary,
        },
      ],
    },
  ],
};

const Values = () => {
  const values = useWatch<EngagementRuleValues>();

  return <pre data-testid="values">{JSON.stringify(values)}</pre>;
};

const Harness = ({
  values,
  onSubmit = () => undefined,
}: {
  values: EngagementRuleValues;
  onSubmit?: (values: EngagementRuleValues) => void;
}) => {
  const form = useForm<EngagementRuleValues>({
    defaultValues: values,
    resolver: zodResolver(createEngagementRuleSchema(t)),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EngagementRuleForm />
        <Values />
        <button type="submit">submit</button>
      </form>
    </FormProvider>
  );
};

const rulesMock = (rules: FullEngagementRuleFragment[]) => ({
  request: { query: EngagementRulesDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { engagementRules: rules } },
});

const renderForm = (
  values: EngagementRuleValues,
  onSubmit?: (values: EngagementRuleValues) => void,
  mocks: MockedResponse[] = []
) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MockedProvider mocks={mocks}>
        <Harness
          values={values}
          onSubmit={onSubmit}
        />
      </MockedProvider>
    </ThemeProvider>
  );

const values = (): EngagementRuleValues =>
  JSON.parse(screen.getByTestId('values').textContent ?? '{}');

describe('EngagementRuleForm', () => {
  it('asks an announcement for one message, without meter or stages', () => {
    renderForm(ENGAGEMENT_PRESETS.displayAnnouncement());

    expect(screen.getAllByTestId(/^stage-/)).toHaveLength(1);
    expect(screen.queryByLabelText(/engagement.form.afterArticles/)).toBeNull();
    expect(
      screen.queryByLabelText(/engagement.form.meterWindowDays/)
    ).toBeNull();
    expect(screen.queryByText('engagement.form.addStage')).toBeNull();
    expect(screen.queryByText('engagement.form.hard')).toBeNull();
  });

  it('asks a metered rule for the window, the stages and the referrals', () => {
    renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    expect(screen.getAllByTestId(/^stage-/)).toHaveLength(2);
    expect(
      screen.getAllByLabelText(/engagement.form.meterWindowDays/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText('engagement.form.newsletterReferral')
    ).toBeInTheDocument();
    expect(screen.getByText('engagement.form.addStage')).toBeInTheDocument();
  });

  it('only offers restricting the article on the last stage, after the article', () => {
    renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    const [first, last] = screen.getAllByTestId(/^stage-/);

    expect(first).not.toHaveTextContent('engagement.form.hard');
    expect(first).not.toHaveTextContent('engagement.form.requirement');
    expect(last).toHaveTextContent('engagement.form.hard');
    expect(last).toHaveTextContent('engagement.form.requirement');
    expect(last).toHaveTextContent('engagement.form.previewBlocks');
  });

  it('explains that newsletter subscriptions can not be verified', () => {
    renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    expect(screen.getByTestId('newsletter-note')).toHaveTextContent(
      'engagement.form.newsletterNote'
    );
  });

  it('shows no newsletter note for other goals', () => {
    renderForm(ENGAGEMENT_PRESETS.promoteMemberships());

    expect(screen.queryByTestId('newsletter-note')).toBeNull();
  });

  it('turns a metered rule into one message when it becomes an announcement', () => {
    renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    fireEvent.click(screen.getByDisplayValue('ANNOUNCEMENT'));

    expect(values()).toMatchObject({
      goal: 'ANNOUNCEMENT',
      meterWindowDays: null,
      newsletterReferral: 'NONE',
      stages: [{ afterArticles: 0, enforcement: 'SOFT', requirement: null }],
    });
    expect(screen.getAllByTestId(/^stage-/)).toHaveLength(1);
  });

  it('refuses inconsistent stages', async () => {
    const onSubmit = vi.fn();
    const preset = ENGAGEMENT_PRESETS.growNewsletter();

    renderForm(
      {
        ...preset,
        name: 'Grow',
        stages: preset.stages.map(stage => ({
          ...stage,
          afterArticles: 2,
          actions: stage.actions.map(action => ({
            ...action,
            url: action.url || 'https://example.com',
          })),
        })),
      },
      onSubmit
    );

    fireEvent.click(screen.getByText('submit'));

    expect(
      await screen.findByText('engagement.validation.ascending')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not mark number fields as hidden', () => {
    const { container } = renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    expect(container.querySelectorAll('[hidden]')).toHaveLength(0);
  });

  it('lays out each action as its own group', () => {
    renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    const [, last] = screen.getAllByTestId(/^stage-/);

    expect(last.querySelectorAll('[data-testid="action"]')).toHaveLength(3);
  });

  it('keeps the rule settings in one column, independent of the stages', () => {
    renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    const settings = screen.getByTestId('rule-settings');

    expect(settings).toHaveTextContent('engagement.form.goal');
    expect(settings).toHaveTextContent('engagement.form.audience');
    expect(settings).toHaveTextContent('engagement.form.trigger');
    expect(settings).not.toContainElement(screen.getAllByTestId(/^stage-/)[0]);
  });

  it('collapses and expands each stage on its own', () => {
    renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    const [first, last] = screen.getAllByRole('button', {
      name: /engagement.form.stage/,
    });

    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(last).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(first);

    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(last).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(first);

    expect(first).toHaveAttribute('aria-expanded', 'true');
  });

  it('sums up each stage in its header, to tell collapsed stages apart', () => {
    renderForm(ENGAGEMENT_PRESETS.growNewsletter());

    const [first] = screen.getAllByRole('button', {
      name: /engagement.form.stage/,
    });

    expect(first).toHaveTextContent('engagement.summary.afterReadRange');
  });

  it('opens collapsed stages that have errors on submit', async () => {
    const preset = ENGAGEMENT_PRESETS.promoteMemberships();

    renderForm({
      ...preset,
      name: 'Members',
      stages: [...preset.stages, { ...preset.stages[0], afterArticles: 1 }],
    });

    const [, last] = screen.getAllByRole('button', {
      name: /engagement.form.stage/,
    });

    fireEvent.click(last);
    expect(last).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => expect(last).toHaveAttribute('aria-expanded', 'true'));
  });

  it('hides the priority while no other rule competes', async () => {
    renderForm(ENGAGEMENT_PRESETS.displayAnnouncement(), undefined, [
      rulesMock([]),
    ]);

    await waitFor(() =>
      expect(screen.queryByTestId('conflicts')).not.toBeInTheDocument()
    );
    expect(screen.queryByLabelText('engagement.form.showFirst')).toBeNull();
  });

  it('shows the competing rules and offers to show this one first', async () => {
    renderForm(ENGAGEMENT_PRESETS.displayAnnouncement(), undefined, [
      rulesMock([competing]),
    ]);

    expect(await screen.findByTestId('conflicts')).toHaveTextContent(
      'engagement.conflict.competes'
    );

    fireEvent.click(screen.getByLabelText('engagement.form.showFirst'));
    expect(values().priority).toBe(SHOW_FIRST_PRIORITY);

    fireEvent.click(screen.getByLabelText('engagement.form.showFirst'));
    expect(values().priority).toBe(0);
  });

  it('keeps the override of a rule that is shown first', () => {
    renderForm({
      ...ENGAGEMENT_PRESETS.displayAnnouncement(),
      priority: SHOW_FIRST_PRIORITY,
    });

    expect(screen.getByLabelText('engagement.form.showFirst')).toBeChecked();
  });

  it('asks for the member plans when the rule is for specific plans', () => {
    renderForm(ENGAGEMENT_PRESETS.promoteMemberships());

    expect(
      screen.queryByLabelText('engagement.form.audienceMemberPlans')
    ).toBeNull();

    fireEvent.click(screen.getByDisplayValue('MEMBER_PLANS'));

    expect(
      screen.getByLabelText('engagement.form.audienceMemberPlans')
    ).toBeInTheDocument();
  });

  it('saves a consistent rule', async () => {
    const onSubmit = vi.fn();
    const preset = ENGAGEMENT_PRESETS.promoteMemberships();

    renderForm({ ...preset, name: 'Members' }, onSubmit);

    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
