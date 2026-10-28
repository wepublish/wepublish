import { MockedProvider } from '@apollo/client/testing/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TFunction } from 'i18next';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { EngagementRuleForm } from './engagement-rule-form';
import {
  EngagementRuleValues,
  createEngagementRuleSchema,
} from './engagement-rule-values';
import { ENGAGEMENT_PRESETS } from './presets';

const t = ((key: string) => key) as unknown as TFunction;

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

const renderForm = (
  values: EngagementRuleValues,
  onSubmit?: (values: EngagementRuleValues) => void
) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MockedProvider>
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

  it('saves a consistent rule', async () => {
    const onSubmit = vi.fn();
    const preset = ENGAGEMENT_PRESETS.promoteMemberships();

    renderForm({ ...preset, name: 'Members' }, onSubmit);

    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
