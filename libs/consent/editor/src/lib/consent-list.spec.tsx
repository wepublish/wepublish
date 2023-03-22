import React from 'react'
import {render} from '@testing-library/react'
import ConsentList from './consent-list'
import {BrowserRouter} from 'react-router-dom'

import fetch from 'jest-fetch-mock'
jest.setMock('node-fetch', fetch)

describe('ConsentList', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <BrowserRouter>
        <ConsentList />
      </BrowserRouter>
    )
    expect(baseElement).toBeTruthy()
  })
})
