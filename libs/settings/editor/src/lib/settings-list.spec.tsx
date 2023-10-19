import {render} from '@testing-library/react'

import {SettingList} from './settings-list'
import {BrowserRouter} from 'react-router-dom'
import fetch from 'jest-fetch-mock'
jest.setMock('node-fetch', fetch)

describe('SettingList', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <BrowserRouter>
        <SettingList />
      </BrowserRouter>
    )
    expect(baseElement).toBeTruthy()
  })
})
