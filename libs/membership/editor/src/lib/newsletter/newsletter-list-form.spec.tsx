import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { NewsletterListLockedDisplay } from '@wepublish/editor/api';
import { Form } from 'rsuite';
import {
  NewsletterListForm,
  NewsletterListFormData,
  newsletterListAccessError,
} from './newsletter-list-form';

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  SelectMemberPlans: () => <div data-testid="select-member-plans" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const publicList: Partial<NewsletterListFormData> = {
  name: 'Morning Briefing',
  slug: 'morning-briefing',
  active: true,
  requiresSubscription: false,
  anyMemberPlan: false,
  autoSubscribe: true,
  lockedDisplay: NewsletterListLockedDisplay.Teaser,
  memberPlanIds: [],
};

const renderForm = (
  list: Partial<NewsletterListFormData>,
  onChange = vi.fn()
) => {
  render(
    <ThemeProvider theme={createTheme()}>
      <Form formValue={list}>
        <NewsletterListForm
          list={list}
          onChange={onChange}
        />
      </Form>
    </ThemeProvider>
  );

  return onChange;
};

describe('newsletterListAccessError', () => {
  it('requires a member plan for a subscriber-only list', () => {
    expect(
      newsletterListAccessError({
        requiresSubscription: true,
        memberPlanIds: [],
      })
    ).toBe('newsletter.form.memberPlansRequired');
  });

  it('accepts a subscriber-only list for any member plan', () => {
    expect(
      newsletterListAccessError({
        requiresSubscription: true,
        anyMemberPlan: true,
        memberPlanIds: [],
      })
    ).toBeUndefined();
  });

  it('accepts a subscriber-only list with a member plan', () => {
    expect(
      newsletterListAccessError({
        requiresSubscription: true,
        memberPlanIds: ['plan-a'],
      })
    ).toBeUndefined();
  });

  it('accepts a public list without member plans', () => {
    expect(newsletterListAccessError(publicList)).toBeUndefined();
  });
});

describe('NewsletterListForm', () => {
  it('hides the subscriber-only settings for a public list', () => {
    renderForm(publicList);

    expect(screen.queryByTestId('select-member-plans')).toBeNull();
    expect(screen.queryByText('newsletter.form.lockedDisplay')).toBeNull();
  });

  it('shows plans, automatic adding and the locked display for a subscriber-only list', () => {
    renderForm({ ...publicList, requiresSubscription: true });

    expect(screen.getByTestId('select-member-plans')).toBeTruthy();
    expect(screen.getByText('newsletter.form.autoSubscribe')).toBeTruthy();
    expect(screen.getByText('newsletter.form.lockedDisplay')).toBeTruthy();
  });

  it('shows the promotion fields only when locked lists are greyed out', () => {
    renderForm({ ...publicList, requiresSubscription: true });

    expect(screen.getByText('newsletter.form.lockedText')).toBeTruthy();
    expect(
      screen.getByPlaceholderText('newsletter.form.lockedLinkUrlPlaceholder')
    ).toBeTruthy();
  });

  it('hides the promotion fields when locked lists are hidden', () => {
    renderForm({
      ...publicList,
      requiresSubscription: true,
      lockedDisplay: NewsletterListLockedDisplay.Hidden,
    });

    expect(screen.queryByText('newsletter.form.lockedText')).toBeNull();
  });

  it('shows the missing member plan error for a subscriber-only list', () => {
    renderForm({ ...publicList, requiresSubscription: true });

    expect(
      screen.getByText('newsletter.form.memberPlansRequired')
    ).toBeTruthy();
  });

  it('reports a changed name', () => {
    const onChange = renderForm(publicList);

    fireEvent.change(screen.getByDisplayValue('Morning Briefing'), {
      target: { value: 'Evening Briefing' },
    });

    expect(onChange).toHaveBeenCalledWith({ name: 'Evening Briefing' });
  });
});
