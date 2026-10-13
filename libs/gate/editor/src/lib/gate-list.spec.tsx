import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  DeleteGateDocument,
  GateMode,
  GatesDocument,
  LoginStatus,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import { AudienceField } from './audience-field';
import { GateList } from './gate-list';

const gate = {
  __typename: 'Gate',
  id: 'gate-1',
  createdAt: '2026-10-14',
  modifiedAt: '2026-10-14',
  mode: GateMode.Paywall,
  name: 'Premium',
  active: true,
  audience: LoginStatus.Unsubscribed,
  anyMemberPlan: false,
  memberPlans: [],
  bypasses: [],
  showOnArticles: false,
  showOnPages: [],
  title: null,
  text: null,
  cta: null,
  html: null,
  embedUrl: null,
  image: null,
  description: null,
  upgradeDescription: null,
  circumventDescription: null,
  upgradeCircumventDescription: null,
  softDescription: null,
  actions: [],
  previewBlocks: 3,
  fadeout: true,
  freeArticles: null,
  softGateArticles: null,
  meterWindowDays: null,
  newsletterParams: [],
  newsletterNeverGate: false,
  newsletterFreeArticles: 0,
  collapsible: true,
  hideForMinutes: 1440,
  delay: 0,
};

const gatesMock = {
  request: { query: GatesDocument, variables: { mode: GateMode.Paywall } },
  result: { data: { gates: [gate] } },
};

describe('GateList', () => {
  const renderList = (mocks: any[]) =>
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <MockedProvider mocks={mocks}>
          <MemoryRouter>
            <GateList
              mode={GateMode.Paywall}
              storageKey="paywalls"
              title="Paywalls"
              createLabel="Create paywall"
              columns={[
                {
                  id: 'name',
                  label: 'Name',
                  width: 300,
                  render: gate => <span>{gate.name}</span>,
                },
              ]}
              deleteTexts={gate => ({
                title: 'Delete?',
                body: `Delete ${gate.name}?`,
                confirm: 'Delete it',
              })}
            />
          </MemoryRouter>
        </MockedProvider>
      </ThemeProvider>
    );

  it('lists the gates of its mode with the given columns', async () => {
    renderList([gatesMock]);

    expect(await screen.findByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Paywalls')).toBeInTheDocument();
  });

  it('deletes a gate after confirming', async () => {
    const deleted = vi.fn(() => ({ data: { deleteGate: gate } }));
    const refetched = vi.fn(() => ({ data: { gates: [] } }));

    renderList([
      gatesMock,
      {
        request: { query: DeleteGateDocument, variables: { id: 'gate-1' } },
        result: deleted,
      },
      { ...gatesMock, result: refetched },
    ]);

    fireEvent.click(await screen.findByLabelText('delete'));
    expect(await screen.findByText('Delete Premium?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Delete it'));

    await waitFor(() => expect(deleted).toHaveBeenCalled());
    await waitFor(() => expect(refetched).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText('Premium')).not.toBeInTheDocument()
    );
  });
});

describe('AudienceField', () => {
  it('offers only the given audiences', () => {
    const onChange = vi.fn();

    render(
      <AudienceField
        name="audience"
        value={LoginStatus.LoggedOut}
        onChange={onChange}
        options={[
          { value: LoginStatus.LoggedOut, label: 'Anonymous' },
          { value: LoginStatus.Unsubscribed, label: 'Non subscribers' },
        ]}
      />
    );

    expect(screen.getAllByRole('radio')).toHaveLength(2);

    fireEvent.click(screen.getByLabelText('Non subscribers'));

    expect(onChange).toHaveBeenCalledWith(LoginStatus.Unsubscribed);
  });
});
