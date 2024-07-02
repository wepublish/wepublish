import React from 'react'
import { render, waitFor } from "@testing-library/react";
import { InjectScript } from './inject-script'
import '@testing-library/jest-dom'
import { ApiV1 } from '@wepublish/website';

jest.mock('@wepublish/website', () => ({
  ...jest.requireActual('@wepublish/website'),
  ApiV1: {
    useSettingQuery: jest.fn()
  }
}))

test('does nothing while loading', async () => {
  ApiV1.useSettingQuery.mockReturnValue({
    loading: true,
    error: null,
    data: null
  })

  const appendChildMock = jest.spyOn(document.body, 'appendChild');

  render(<InjectScript />)

  await waitFor(() => {
    // somehow, this does call appendChild once with an empty div.

    expect(appendChildMock).toHaveBeenCalledTimes(1);
    const scriptTag = appendChildMock.mock.calls[0][0] as HTMLElement;
    expect(scriptTag.tagName).toBe('DIV');
    expect(scriptTag.innerHTML).toBe('');
  });
  
  appendChildMock.mockRestore();
})

test('injects a script tag into the document body', async () => {
  const mockData = {
    setting: {
      id: 'cly3622cz000fi0p1bo0yqkde',
      name: 'BODY_SCRIPT',
      value: '<script id="test-script">console.log("Test script loaded");</script>'
    }
  }
  
  ApiV1.useSettingQuery.mockReturnValue({
    loading: false,
    error: null,
    data: mockData
  })

  const appendChildMock = jest.spyOn(document.body, 'appendChild');

  render(<InjectScript />)

  await waitFor(() => {
    expect(appendChildMock).toHaveBeenCalledTimes(2);
    const scriptTag = appendChildMock.mock.calls[1][0] as HTMLElement;
    expect(scriptTag.tagName).toBe('SCRIPT');
    expect(scriptTag.id).toBe('test-script');
    expect(scriptTag.textContent).toBe('console.log("Test script loaded");');
  });
  
  appendChildMock.mockRestore();
})
