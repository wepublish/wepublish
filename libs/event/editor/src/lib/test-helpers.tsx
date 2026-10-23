import { zodResolver } from '@hookform/resolvers/zod';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { renderWith } from './event-list/test-helpers';
import {
  emptyEventForm,
  EventFormValues,
  eventFormSchema,
} from './event-form-schema';

export const FORM_NOW = new Date('2026-10-23T08:00:00.000Z');

function Values() {
  const values = useWatch<EventFormValues>();

  return (
    <output data-testid="form-values">{JSON.stringify(values ?? {})}</output>
  );
}

function EventFormHarness({
  children,
  defaultValues,
  onSubmit,
}: {
  children: ReactNode;
  defaultValues: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => void;
}) {
  const form = useForm<EventFormValues>({
    defaultValues: { ...emptyEventForm(), ...defaultValues },
    resolver: zodResolver(eventFormSchema(FORM_NOW)),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children}
        <button type="submit">submit</button>
        <Values />
      </form>
    </FormProvider>
  );
}

export const renderInForm = (
  ui: ReactNode,
  {
    defaultValues = {},
    permissions = [],
  }: { defaultValues?: Partial<EventFormValues>; permissions?: string[] } = {}
) => {
  const onSubmit = vi.fn();

  render(
    renderWith(
      <EventFormHarness
        defaultValues={defaultValues}
        onSubmit={onSubmit}
      >
        {ui}
      </EventFormHarness>,
      { permissions }
    )
  );

  return onSubmit;
};

export const formValues = (): EventFormValues =>
  JSON.parse(screen.getByTestId('form-values').textContent ?? '{}');

export const mockElementRects = () =>
  vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      const index =
        this.tagName === 'LI' && this.parentElement ?
          [...this.parentElement.children].indexOf(this)
        : 0;
      const top = index * 50;

      return {
        x: 0,
        y: top,
        top,
        left: 0,
        right: 400,
        bottom: top + 40,
        width: 400,
        height: 40,
        toJSON: () => undefined,
      } as DOMRect;
    });

export const press = async (
  element: HTMLElement,
  code: string,
  key: string
) => {
  await act(async () => {
    fireEvent.keyDown(element, { code, key });
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

export const moveFirstRowDown = async () => {
  const [handle] = screen.getAllByRole('button', {
    name: 'listInput.dragToReorder',
  });

  handle.focus();
  await press(handle, 'Space', ' ');
  await press(handle, 'ArrowDown', 'ArrowDown');
  await press(handle, 'Space', ' ');
};
