import { within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

export function autocompleteOf(input: HTMLElement): HTMLElement {
  const root = input.closest<HTMLElement>('.MuiAutocomplete-root');

  if (!root) {
    throw new Error('The input is not part of an autocomplete');
  }

  return root;
}

export async function clearButtonOf(
  user: UserEvent,
  input: HTMLElement
): Promise<HTMLElement> {
  await user.click(input);

  return within(autocompleteOf(input)).getByRole('button', { name: 'Clear' });
}
