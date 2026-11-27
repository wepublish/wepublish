import { createTheme, ThemeProvider } from '@mui/material';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MailRecipientBase } from '@wepublish/editor/api';

import { SavedAudienceFilters } from './saved-audience-filters';

const queries = vi.fn();
const mutations: Record<string, ReturnType<typeof vi.fn>> = {};

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value as string;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown) => queries(operationName(document)),
  useMutation: (document: unknown) => {
    const name = operationName(document);
    mutations[name] ??= vi.fn(async () => ({}));

    return [mutations[name], { loading: false }];
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: 'de-CH' },
  }),
}));

const reminded = {
  id: 'f1',
  name: 'Reminded twice',
  description: 'For the letter run',
  audience: {
    base: 'hasSubscription',
    isPaid: false,
    memberPlanIDs: ['plan-1', 'plan-gone'],
  },
};
const everyone = {
  id: 'f2',
  name: 'Everyone',
  description: null,
  audience: { base: 'allUsers' },
};

const current = { base: MailRecipientBase.NoActiveSubscription };

const renderTable = (filters = [reminded, everyone]) => {
  queries.mockImplementation((name: string) => {
    switch (name) {
      case 'SavedAudienceFilters':
        return { data: { savedAudienceFilters: filters } };
      case 'MemberPlanList':
        return {
          data: {
            memberPlans: { nodes: [{ id: 'plan-1', name: 'Jahresabo' }] },
          },
        };
      default:
        return { data: undefined };
    }
  });
  const onLoad = vi.fn();

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <SavedAudienceFilters
        audience={current}
        onLoad={onLoad}
      />
    </ThemeProvider>
  );

  return onLoad;
};

const rowOf = (name: string) =>
  screen.getByRole('row', { name: new RegExp(name) });
const button = (name: string, within_: HTMLElement = document.body) =>
  within(within_).getByRole('button', { name });
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByRole('textbox', { name: label }), {
    target: { value },
  });

describe('SavedAudienceFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('lists the saved filters with name, description and what they select', () => {
    renderTable();

    const row = rowOf('Reminded twice');

    expect(within(row).getByText('For the letter run')).toBeTruthy();
    expect(within(row).getByText('mailSend.base.hasSubscription')).toBeTruthy();
    expect(rowOf('Everyone')).toBeTruthy();
  });

  it('says so while nothing is saved', () => {
    renderTable([]);

    expect(screen.getByText('mailSend.savedFilters.empty')).toBeTruthy();
  });

  it('loads a filter into the controls', () => {
    const onLoad = renderTable();

    fireEvent.click(button('mailSend.savedFilters.load', rowOf('Everyone')));

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad.mock.calls[0][0].base).toBe(MailRecipientBase.AllUsers);
    expect(
      screen.getByText('mailSend.savedFilters.loaded:{"name":"Everyone"}')
    ).toBeTruthy();
  });

  it('leaves out a plan that no longer exists and warns about it', () => {
    const onLoad = renderTable();

    fireEvent.click(
      button('mailSend.savedFilters.load', rowOf('Reminded twice'))
    );

    expect(onLoad.mock.calls[0][0].memberPlanIDs).toEqual(['plan-1']);
    expect(
      screen.getByText(
        /mailSend\.savedFilters\.dropped\.memberPlans:\{"count":1\}/
      )
    ).toBeTruthy();
  });

  it('saves the current filter under a name and a description', () => {
    renderTable();

    fireEvent.click(button('mailSend.savedFilters.save'));
    type('mailSend.savedFilters.name', ' Lapsed ');
    type('mailSend.savedFilters.description', 'No active subscription');
    fireEvent.click(button('mailSend.savedFilters.confirmSave'));

    expect(mutations['CreateSavedAudienceFilter']).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Lapsed',
          description: 'No active subscription',
          audience: current,
        },
      },
    });
  });

  it('asks for a name before it saves', () => {
    renderTable();

    fireEvent.click(button('mailSend.savedFilters.save'));
    fireEvent.click(button('mailSend.savedFilters.confirmSave'));

    expect(screen.getByText('mailSend.savedFilters.nameRequired')).toBeTruthy();
    expect(mutations['CreateSavedAudienceFilter']).not.toHaveBeenCalled();
  });

  it('refuses a name another filter already has, whatever the case', () => {
    renderTable();

    fireEvent.click(button('mailSend.savedFilters.save'));
    type('mailSend.savedFilters.name', 'everyone');
    fireEvent.click(button('mailSend.savedFilters.confirmSave'));

    expect(screen.getByText('mailSend.savedFilters.nameTaken')).toBeTruthy();
    expect(mutations['CreateSavedAudienceFilter']).not.toHaveBeenCalled();
  });

  it('renames a filter without touching what it selects', () => {
    renderTable();

    fireEvent.click(
      button('mailSend.savedFilters.edit', rowOf('Reminded twice'))
    );
    type('mailSend.savedFilters.name', 'Reminded three times');
    fireEvent.click(button('mailSend.savedFilters.confirmSave'));

    expect(mutations['UpdateSavedAudienceFilter']).toHaveBeenCalledWith({
      variables: {
        id: 'f1',
        input: {
          name: 'Reminded three times',
          description: 'For the letter run',
        },
      },
    });
  });

  it('lets a filter keep its own name when it is edited', () => {
    renderTable();

    fireEvent.click(button('mailSend.savedFilters.edit', rowOf('Everyone')));
    type('mailSend.savedFilters.description', 'All users');
    fireEvent.click(button('mailSend.savedFilters.confirmSave'));

    expect(mutations['UpdateSavedAudienceFilter']).toHaveBeenCalledWith({
      variables: {
        id: 'f2',
        input: { name: 'Everyone', description: 'All users' },
      },
    });
  });

  it('overwrites a filter with the current one only after a confirmation', () => {
    renderTable();

    fireEvent.click(
      button('mailSend.savedFilters.overwrite', rowOf('Everyone'))
    );

    expect(mutations['UpdateSavedAudienceFilter']).not.toHaveBeenCalled();

    fireEvent.click(button('mailSend.savedFilters.overwriteConfirm'));

    expect(mutations['UpdateSavedAudienceFilter']).toHaveBeenCalledWith({
      variables: { id: 'f2', input: { audience: current } },
    });
  });

  it('deletes a filter only after a confirmation', () => {
    renderTable();

    fireEvent.click(button('mailSend.savedFilters.delete', rowOf('Everyone')));

    expect(mutations['DeleteSavedAudienceFilter']).not.toHaveBeenCalled();

    fireEvent.click(button('mailSend.savedFilters.deleteConfirm'));

    expect(mutations['DeleteSavedAudienceFilter']).toHaveBeenCalledWith({
      variables: { id: 'f2' },
    });
  });
});
