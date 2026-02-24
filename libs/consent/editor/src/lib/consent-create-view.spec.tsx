import React from 'react';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

import { ConsentCreateView } from './consent-create-view';
import { BrowserRouter } from 'react-router-dom';
import fetch from 'jest-fetch-mock';
jest.setMock('node-fetch', fetch);

describe('ConsentCreateView', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <MockedProvider>
          <ConsentCreateView />
        </MockedProvider>
      </BrowserRouter>
    );
    expect(baseElement).toBeTruthy();
  });
});
