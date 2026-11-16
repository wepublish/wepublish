import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { EngagementRuleDocument } from '@wepublish/editor/api';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditEngagementRule } from './edit-engagement-rule';

const session = {
  session: {
    sessionRoles: [{ permissions: [{ id: 'CAN_UPDATE_ENGAGEMENT_RULE' }] }],
  },
} as never;

describe('EditEngagementRule', () => {
  it('leads back to the rules for a rule that does not exist (any more)', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={session}>
          <MockedProvider
            mocks={[
              {
                request: {
                  query: EngagementRuleDocument,
                  variables: { id: 'gone' },
                },
                result: {
                  errors: [{ message: 'Engagement rule gone not found.' }],
                },
              },
            ]}
          >
            <MemoryRouter initialEntries={['/audience-engagement/edit/gone']}>
              <Routes>
                <Route
                  path="/audience-engagement/edit/:id"
                  element={<EditEngagementRule />}
                />
                <Route
                  path="/audience-engagement"
                  element={<p>rule list</p>}
                />
              </Routes>
            </MemoryRouter>
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    expect(await screen.findByText('rule list')).toBeInTheDocument();
  });
});
