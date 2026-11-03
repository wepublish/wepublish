import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { getFieldByLabel } from '@wepublish/form/editor/testing';

export const name = () =>
  screen.getByRole('textbox', { name: /^crowdfunding\.form\.name/ });

export const goalType = () =>
  screen.getByRole('combobox', { name: /^crowdfunding\.form\.goalType/ });

export const additionalSubscriptions = () =>
  screen.getByRole('spinbutton', {
    name: /^crowdfunding\.form\.additionalSubscriptions/,
  });

export const additionalRevenue = () =>
  screen.getByRole('textbox', {
    name: /^crowdfunding\.form\.additionalRevenue/,
  });

export const goalTitles = () =>
  screen.queryAllByRole<HTMLInputElement>('textbox', {
    name: /^crowdfunding\.goalsForm\.title/,
  });

export const goalDescriptions = () =>
  screen.queryAllByRole<HTMLInputElement>('textbox', {
    name: /^crowdfunding\.goalsForm\.description/,
  });

export const goalAmounts = () =>
  screen.queryAllByRole<HTMLInputElement>('spinbutton', {
    name: /^crowdfunding\.goalsForm\.amountSubscriptions/,
  });

export const goalRevenues = () =>
  screen.queryAllByRole<HTMLInputElement>('textbox', {
    name: /^crowdfunding\.goalsForm\.amount(?!Subscriptions)/,
  });

export const addGoal = () =>
  screen.getByRole('button', { name: 'crowdfunding.goalsForm.add' });

export const saveButton = () => screen.getByRole('button', { name: 'save' });

export const saveAndCloseButton = () =>
  screen.getByRole('button', { name: 'saveAndClose' });

export const controlOf = (input: HTMLElement) => {
  const control = input.closest<HTMLElement>('.MuiFormControl-root');

  if (!control) {
    throw new Error('The input sits in no form control');
  }

  return control;
};

export const chooseGoalType = async (user: UserEvent, type: string) => {
  await user.click(goalType());
  await user.click(
    await screen.findByRole('option', {
      name: `crowdfunding.form.goalTypes.${type}`,
    })
  );
};

export const pickMemberPlan = async (user: UserEvent, plan: string) => {
  if (!screen.queryByRole('listbox')) {
    await user.click(
      screen.getByPlaceholderText('crowdfunding.form.selectMemberPlans')
    );
  }

  await user.click(await screen.findByRole('option', { name: plan }));
};

export const typeDate = async (
  user: UserEvent,
  label: RegExp,
  text: string
) => {
  await user.click(getFieldByLabel(label));
  await user.keyboard(text);
  await user.keyboard('{Escape}');
};

export const settled = () =>
  new Promise(resolve => {
    setTimeout(resolve, 50);
  });

export function trackUnhandledRejections() {
  const unhandled: unknown[] = [];
  const record = (reason: unknown) => {
    unhandled.push(reason);
  };
  let vitestListeners: NodeJS.UnhandledRejectionListener[] = [];

  beforeEach(() => {
    unhandled.length = 0;
    vitestListeners = process.listeners('unhandledRejection');
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', record);
  });

  afterEach(() => {
    process.off('unhandledRejection', record);
    vitestListeners.forEach(listener =>
      process.on('unhandledRejection', listener)
    );
  });

  return unhandled;
}
