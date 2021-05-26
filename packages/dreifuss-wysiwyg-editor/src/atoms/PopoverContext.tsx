import {createContext} from 'react'

interface PopoverContextProps {
  togglePopover: () => void
}

const emptyFn = () => {
  /* do nothing */
}

export const PopoverContext = createContext<PopoverContextProps>({
  togglePopover: emptyFn
})

export default PopoverContext
