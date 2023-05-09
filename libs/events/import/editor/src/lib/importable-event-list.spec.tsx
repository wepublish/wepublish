import React from 'react'
import {render} from '@testing-library/react'
import {ImportableEventListView} from './importable-event-list'
import {BrowserRouter} from 'react-router-dom'

import fetch from 'jest-fetch-mock'
jest.setMock('node-fetch', fetch)

describe('ConsentList', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <BrowserRouter>
        <ImportableEventListView />
      </BrowserRouter>
    )
    expect(baseElement).toBeTruthy()
  })
})
