import { render } from '@testing-library/react';
import { ConsentList } from './consent-list';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider, MockLink } from '@apollo/client/testing';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import * as v2Client from '@wepublish/editor/api';

vi.mock('node-fetch', () => ({ default: vi.fn() }));

describe('ConsentList', () => {
  beforeAll(() => {
    vi.spyOn(v2Client, 'getApiClientV2').mockReturnValue(
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new MockLink([], true, { showWarnings: false }),
      })
    );
  });

  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <MockedProvider>
          <ConsentList />
        </MockedProvider>
      </BrowserRouter>
    );
    expect(baseElement).toBeTruthy();
  });
});
