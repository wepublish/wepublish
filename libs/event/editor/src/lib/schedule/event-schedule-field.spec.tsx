import { fireEvent, screen, within } from '@testing-library/react';
import { EventScheduleType } from '@wepublish/editor/api';

import { emptyEventForm, EventFormValues } from '../event-form-schema';
import {
  FORM_NOW,
  formValues,
  mockElementRects,
  moveFirstRowDown,
  renderInForm,
} from '../test-helpers';
import { EventScheduleField } from './event-schedule-field';
import { ScheduleForm } from './schedule-form';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

const schedule = (overrides: Partial<ScheduleForm>): ScheduleForm => ({
  ...emptyEventForm().schedule,
  ...overrides,
});

const weeklySchedule = (weekDays: number[]) =>
  schedule({
    scheduleType: EventScheduleType.Weekly,
    weekly: {
      dateFrom: '2027-04-01',
      timeFrom: '20:00',
      dateTo: '2027-06-30',
      timeTo: '22:00',
      openingTime: '',
      weekDays,
    },
  });

const explicitSchedule = () =>
  schedule({
    scheduleType: EventScheduleType.Explicit,
    explicit: [
      {
        id: 'a',
        value: {
          date: '2027-05-12',
          timeFrom: '20:00',
          timeTo: '23:30',
          openingTime: '19:00',
        },
      },
      {
        id: 'b',
        value: {
          date: '2027-05-14',
          timeFrom: '19:00',
          timeTo: '21:00',
          openingTime: '',
        },
      },
    ],
  });

const renderField = (defaultValues: Partial<EventFormValues> = {}) =>
  renderInForm(<EventScheduleField now={FORM_NOW} />, { defaultValues });

describe('EventScheduleField', () => {
  it('is a fieldset with the legend “When does it happen?”', () => {
    renderField();

    expect(
      screen.getByRole('group', { name: 'agenda.schedule.legend' })
    ).toBeInTheDocument();
  });

  it('offers three modes, each named by its situation and described by an example', () => {
    renderField();

    const radios = screen.getAllByRole('radio');

    expect(radios).toHaveLength(3);

    for (const mode of ['Continuous', 'Weekly', 'Explicit']) {
      const radio = screen.getByRole('radio', {
        name: `agenda.schedule.modes.${mode}.label`,
      });

      expect(radio).toHaveAccessibleDescription(
        `agenda.schedule.modes.${mode}.example`
      );
    }
  });

  it('shows the fields of the chosen mode and keeps the others’ values', () => {
    renderField({ schedule: weeklySchedule([4, 5]) });

    fireEvent.click(
      screen.getByRole('radio', {
        name: 'agenda.schedule.modes.Continuous.label',
      })
    );

    expect(
      screen.queryByRole('checkbox', { name: 'Thursday' })
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('radio', { name: 'agenda.schedule.modes.Weekly.label' })
    );

    expect(screen.getByRole('checkbox', { name: 'Thursday' })).toBeChecked();
    expect(formValues().schedule.weekly.weekDays).toEqual([4, 5]);
  });

  it('gives the weekday toggles the full day names', () => {
    renderField({ schedule: weeklySchedule([]) });

    const days = within(
      screen.getByRole('group', { name: 'agenda.schedule.weekDays' })
    ).getAllByRole('checkbox');

    expect(days.map(day => day.getAttribute('aria-label'))).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
  });

  it('updates the count in a polite live region as days are ticked', () => {
    renderField({ schedule: weeklySchedule([4]) });

    const count = screen.getByTestId('schedule-count');

    expect(count).toHaveAttribute('aria-live', 'polite');
    expect(count).toHaveTextContent(
      'agenda.schedule.countWeekly 13 20:00 22:00'
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Friday' }));

    expect(count).toHaveTextContent(
      'agenda.schedule.countWeekly 26 20:00 22:00'
    );
    expect(formValues().schedule.weekly.weekDays).toEqual([4, 5]);
  });

  it('says “Pick at least one day” at the toggles once the last day is unticked', () => {
    renderField({ schedule: weeklySchedule([4]) });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Thursday' }));

    expect(
      screen.getByText('agenda.schedule.problems.MissingWeekDays')
    ).toBeInTheDocument();
    expect(screen.getByTestId('schedule-count')).toHaveTextContent('');
  });

  it('names the last schedulable day at the end date, without a time', () => {
    renderField();

    expect(
      screen.getByText('agenda.schedule.horizon 23 October 2028')
    ).toBeInTheDocument();
  });

  it('turns the horizon note into an error when the end date passes it', async () => {
    renderField({
      schedule: schedule({
        continuous: {
          dateFrom: '2028-10-01',
          timeFrom: '20:00',
          dateTo: '2028-10-24',
          timeTo: '00:00',
          openingTime: '',
        },
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(
      await screen.findByText(
        'agenda.schedule.problems.BeyondScheduleHorizon 23 October 2028'
      )
    ).toBeInTheDocument();
  });

  it('counts explicit dates', () => {
    renderField({ schedule: explicitSchedule() });

    expect(screen.getByTestId('schedule-count')).toHaveTextContent(
      'agenda.schedule.countExplicit 2'
    );
  });

  it('copies the last explicit row onto the following day with Duplicate last', () => {
    renderField({ schedule: explicitSchedule() });

    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.schedule.duplicateLast' })
    );

    expect(formValues().schedule.explicit.map(({ value }) => value)).toEqual([
      expect.objectContaining({ date: '2027-05-12' }),
      expect.objectContaining({ date: '2027-05-14' }),
      {
        date: '2027-05-15',
        timeFrom: '19:00',
        timeTo: '21:00',
        openingTime: '',
      },
    ]);
  });

  it('labels each explicit row’s fields with its position', () => {
    renderField({ schedule: explicitSchedule() });

    expect(screen.getByLabelText('agenda.schedule.rowDate 2')).toHaveValue(
      '2027-05-14'
    );
  });

  describe('explicit rows', () => {
    let rects: ReturnType<typeof mockElementRects>;

    beforeEach(() => {
      rects = mockElementRects();
    });

    afterEach(() => {
      rects.mockRestore();
    });

    it('reorder by keyboard', async () => {
      renderField({ schedule: explicitSchedule() });

      await moveFirstRowDown();

      expect(formValues().schedule.explicit.map(({ id }) => id)).toEqual([
        'b',
        'a',
      ]);
    });
  });
});
