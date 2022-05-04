import {mount} from 'enzyme'
import React from 'react'
import {
  UnsavedChangesDialogMessage,
  useUnsavedChangesDialog
} from '../../src/client/unsavedChangesDialog'

const TestComponent = ({hasChanged}: {hasChanged: boolean}) => {
  const openDialog = useUnsavedChangesDialog(hasChanged)

  return <button onClick={openDialog}></button>
}

describe('Unsaved Changes Dialog', () => {
  beforeAll(() => {
    window.confirm = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it.each([
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

      const wrapper = mount(<TestComponent hasChanged={current} />)
      wrapper.setProps({hasChanged: next})

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
    const wrapper = mount(<TestComponent hasChanged={hasChanged} />)
    wrapper.find('button').simulate('click')

    if (shouldOpenDialog) {
      expect(window.confirm).toHaveBeenCalledWith(UnsavedChangesDialogMessage)
    } else {
      expect(window.confirm).not.toHaveBeenCalled()
    }
  })
})
