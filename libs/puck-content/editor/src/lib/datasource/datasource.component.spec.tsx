import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import i18next from 'i18next';
import { useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import type {
  ImageMultiPickerProps,
  ImagePickerProps,
} from '../image/image.component';
import {
  matchesRecordQuery,
  RecordModel,
  RecordOption,
} from '../record/record.field';
import {
  RecordSearchOptions,
  RecordSource,
  RecordSources,
  RecordSourcesContext,
} from '../record/record.sources';
import { DatasourceFieldRender } from './datasource.component';
import {
  DatasourceField,
  DatasourcesValue,
  imageDatasourceTarget,
} from './datasource.field';

const multiPicker = vi.hoisted(() => ({
  uploadTarget: undefined as ImageMultiPickerProps['uploadTarget'],
}));

vi.mock('../image/image.component', () => ({
  ImagePicker: ({ value, onChange }: ImagePickerProps) => (
    <button
      type="button"
      onClick={() => onChange('i1')}
    >
      {`Image picker ${value ?? 'empty'}`}
    </button>
  ),
  ImageMultiPicker: ({
    value,
    onChange,
    uploadTarget,
  }: ImageMultiPickerProps) => {
    multiPicker.uploadTarget = uploadTarget;

    return (
      <button
        type="button"
        onClick={() => onChange([...value, 'i2'])}
      >
        {`Image multi picker ${value.join(',')}`}
      </button>
    );
  },
}));

const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {},
  initImmediate: false,
  interpolation: { escapeValue: false },
});

const records: Record<RecordModel, RecordOption[]> = {
  article: [
    { id: 'a1', title: 'Climate report', status: 'published' },
    { id: 'a2', title: 'Budget vote', status: 'draft' },
  ],
  page: [{ id: 'p1', title: 'About us', status: 'published' }],
  event: [{ id: 'e1', title: 'Town hall' }],
  memberPlan: [{ id: 'm1', title: 'Yearly' }],
  author: [],
  paywall: [],
};

const sourceOf = (model: RecordModel): RecordSource => ({
  model,
  useSearch: (query: string, { skip = false }: RecordSearchOptions = {}) => ({
    options:
      skip ?
        []
      : records[model].filter(record =>
          matchesRecordQuery(record.title, query)
        ),
    loading: false,
    hasMore: false,
    loadMore: () => undefined,
  }),
  useRecords: (ids: string[]) => ({
    records: Object.fromEntries(
      records[model]
        .filter(record => ids.includes(record.id))
        .map(record => [record.id, record])
    ),
    loading: false,
  }),
});

const sources: RecordSources = {
  article: sourceOf('article'),
  page: sourceOf('page'),
  event: sourceOf('event'),
  memberPlan: sourceOf('memberPlan'),
  author: sourceOf('author'),
  paywall: sourceOf('paywall'),
};

const Harness = ({
  field,
  initial,
  onChange,
  readOnly,
}: {
  field: Omit<DatasourceField, 'type'>;
  initial?: DatasourcesValue;
  onChange: (value: DatasourcesValue | undefined) => void;
  readOnly?: boolean;
}) => {
  const [value, setValue] = useState(initial);

  return (
    <DatasourceFieldRender
      name="datasources"
      field={{ ...field, type: 'datasource' }}
      value={value}
      readOnly={readOnly}
      onChange={next => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

const renderField = (props: Parameters<typeof Harness>[0]) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <RecordSourcesContext.Provider value={sources}>
          <Harness {...props} />
        </RecordSourcesContext.Provider>
      </ThemeProvider>
    </I18nextProvider>
  );

const layoutTypes: DatasourceField['types'] = [
  'uniqueList',
  'list',
  'multiple',
];

describe('DatasourceFieldRender', () => {
  it('only shows the data sources the editor chose', () => {
    renderField({
      field: { types: layoutTypes },
      initial: { article: { type: 'uniqueList' } },
      onChange: vi.fn(),
    });

    const card = screen.getByRole('region', { name: 'Articles' });

    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(
      within(card).getByText(
        'Shows the newest articles automatically, skipping any already shown on the page.'
      )
    ).toBeTruthy();
  });

  it('says when no data is connected yet', () => {
    renderField({ field: { types: layoutTypes }, onChange: vi.fn() });

    expect(screen.queryAllByRole('region')).toHaveLength(0);
    expect(screen.getByText('No data connected yet.')).toBeTruthy();
  });

  it('adds a data source from a menu of the remaining models', async () => {
    const onChange = vi.fn();

    renderField({
      field: { types: layoutTypes },
      initial: { article: { type: 'uniqueList' } },
      onChange,
    });

    const add = screen.getByRole('button', { name: 'Add data source' });

    expect(add.getAttribute('aria-haspopup')).toBe('menu');

    fireEvent.click(add);

    const menu = await screen.findByRole('menu');

    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map(item => item.textContent)
    ).toEqual([
      'Pages',
      'Events',
      'Images',
      'Member plans',
      'User subscriptions',
    ]);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Events' }));

    expect(onChange).toHaveBeenLastCalledWith({
      article: { type: 'uniqueList' },
      event: { type: 'uniqueList' },
    });

    const card = screen.getByRole('region', { name: 'Events' });

    await waitFor(() => expect(document.activeElement).toBe(card));
  });

  it('removes a data source and moves focus to the add button', async () => {
    const onChange = vi.fn();

    renderField({
      field: { types: layoutTypes },
      initial: { article: { type: 'list' }, page: { type: 'list' } },
      onChange,
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Articles data source' })
    );

    expect(onChange).toHaveBeenLastCalledWith({ page: { type: 'list' } });
    expect(screen.queryByRole('region', { name: 'Articles' })).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Add data source' })
      )
    );
  });

  it('hides the add button once every allowed model is used', () => {
    renderField({
      field: { models: ['article'], types: ['list', 'single'] },
      initial: { article: { type: 'list' } },
      onChange: vi.fn(),
    });

    expect(
      screen.queryByRole('button', { name: 'Add data source' })
    ).toBeNull();
  });

  it('switches the type with human labels and keeps the picked record', () => {
    const onChange = vi.fn();

    renderField({
      field: { types: ['single', 'multiple'] },
      initial: { article: { type: 'single', id: 'a1' } },
      onChange,
    });

    const types = screen.getByRole('radiogroup', { name: 'Which articles' });

    expect(within(types).getAllByRole('radio')).toHaveLength(2);
    expect(
      (
        within(types).getByRole('radio', {
          name: 'Pick one',
        }) as HTMLInputElement
      ).checked
    ).toBe(true);

    fireEvent.click(within(types).getByRole('radio', { name: 'Pick several' }));

    expect(onChange).toHaveBeenLastCalledWith({
      article: { type: 'multiple', ids: ['a1'] },
    });
    expect(
      within(screen.getByRole('list', { name: 'Articles' })).getByText(
        'Climate report'
      )
    ).toBeTruthy();
  });

  it('keeps the picked records while stepping through the types', () => {
    const onChange = vi.fn();

    renderField({
      field: {},
      initial: { article: { type: 'multiple', ids: ['a2', 'a1'] } },
      onChange,
    });

    const types = screen.getByRole('radiogroup', { name: 'Which articles' });

    fireEvent.click(within(types).getByRole('radio', { name: 'Pick one' }));
    fireEvent.click(within(types).getByRole('radio', { name: 'From parent' }));

    expect(onChange).toHaveBeenLastCalledWith({ article: { type: 'slot' } });

    fireEvent.click(within(types).getByRole('radio', { name: 'Pick several' }));

    expect(onChange).toHaveBeenLastCalledWith({
      article: { type: 'multiple', ids: ['a2', 'a1'] },
    });
    expect(
      within(screen.getByRole('list', { name: 'Articles' }))
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual([
      expect.stringContaining('Budget vote'),
      expect.stringContaining('Climate report'),
    ]);
  });

  it('hides the type choice when the model allows only one type', () => {
    renderField({
      field: { types: ['list', 'multiple'] },
      initial: { userSubscription: { type: 'list' } },
      onChange: vi.fn(),
    });

    expect(
      screen.getByRole('region', { name: 'User subscriptions' })
    ).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('picks a record with the record picker', async () => {
    const onChange = vi.fn();

    renderField({
      field: { models: ['article', 'page'], types: ['single'] },
      initial: { page: { type: 'single', id: '' } },
      onChange,
    });

    const input = screen.getByRole('combobox', { name: 'Pages' });

    fireEvent.mouseDown(input);
    fireEvent.click(await screen.findByRole('option', { name: /About us/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      page: { type: 'single', id: 'p1' },
    });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Replace About us' })
      )
    );
  });

  it('picks several images with the image picker', () => {
    const onChange = vi.fn();

    renderField({
      field: { types: layoutTypes },
      initial: { image: { type: 'multiple', ids: ['i1'] } },
      onChange,
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Image multi picker i1' })
    );

    expect(onChange).toHaveBeenLastCalledWith({
      image: { type: 'multiple', ids: ['i1', 'i2'] },
    });
    expect(multiPicker.uploadTarget).toBe(imageDatasourceTarget);
  });

  it('renders the picker directly for one model with one type', () => {
    const onChange = vi.fn();

    renderField({
      field: { models: ['image'], types: ['single'], label: 'Image' },
      onChange,
    });

    expect(screen.getByText('Image')).toBeTruthy();
    expect(screen.queryByRole('region')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Add data source' })
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Image picker empty' }));

    expect(onChange).toHaveBeenLastCalledWith({
      image: { type: 'single', id: 'i1' },
    });
  });

  it('picks member plans directly for a subscribe block', async () => {
    const onChange = vi.fn();

    renderField({
      field: {
        models: ['memberPlan'],
        types: ['multiple'],
        label: 'Member plans',
      },
      initial: { memberPlan: { type: 'multiple', ids: [] } },
      onChange,
    });

    const input = screen.getByRole('combobox', { name: 'Add member plan' });

    fireEvent.mouseDown(input);
    fireEvent.click(await screen.findByRole('option', { name: /Yearly/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      memberPlan: { type: 'multiple', ids: ['m1'] },
    });
  });

  it('cannot be changed when read only', () => {
    renderField({
      field: { types: ['single', 'multiple'] },
      initial: { article: { type: 'single', id: 'a1' } },
      onChange: vi.fn(),
      readOnly: true,
    });

    expect(
      screen.queryByRole('button', { name: 'Add data source' })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Remove Articles data source' })
    ).toBeNull();
    expect(
      (screen.getByRole('radio', { name: 'Pick several' }) as HTMLInputElement)
        .disabled
    ).toBe(true);
  });
});
