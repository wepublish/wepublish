import {fireEvent, render} from '@testing-library/react'
import React from 'react'

import {
  UnsavedChangesDialogMessage,
  useUnsavedChangesDialog
} from '../../src/app/unsavedChangesDialog'

const TestComponent = ({hasChanged}: {hasChanged: boolean}) => {
  const openDialog = useUnsavedChangesDialog(hasChanged)

  return <button data-testid="open-dialog" onClick={openDialog}></button>
}

describe('Unsaved Changes Dialog', () => {
  beforeAll(() => {
    window.confirm = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test.each([
    {
      current: false,
      next: true,
      shouldAdd: true,
      shouldUpdate: false
    },
    {
      current: true,
      next: false,
      shouldAdd: true,
      shouldUpdate: true
    },
    {
      current: false,
      next: false,
      shouldAdd: false,
      shouldUpdate: false
    }
  ])(
    'should properly attach and detach listeners for %s',
    async ({current, next, shouldAdd, shouldUpdate}) => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const {rerender} = render(<TestComponent hasChanged={current} />)
      rerender(<TestComponent hasChanged={next} />)

      if (shouldAdd) {
        expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

        if (shouldUpdate) {
          expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
        }
      } else {
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function))
        expect(removeEventListenerSpy).not.toHaveBeenCalledWith(
          'beforeunload',
          expect.any(Function)
        )
      }
    }
  )

  it.each([
    {
      hasChanged: false,
      shouldOpenDialog: false
    },
    {
      hasChanged: true,
      shouldOpenDialog: true
    }
  ])('should work when executing callback for %s', async ({hasChanged, shouldOpenDialog}) => {
    const {findByTestId} = render(<TestComponent hasChanged={hasChanged} />)
    fireEvent.click(await findByTestId('open-dialog'))

    if (shouldOpenDialog) {
      expect(window.confirm).toHaveBeenCalledWith(UnsavedChangesDialogMessage)
    } else {
      expect(window.confirm).not.toHaveBeenCalled()
    }
  })
})
