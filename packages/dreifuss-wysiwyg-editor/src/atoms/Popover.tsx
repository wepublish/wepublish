import React from 'react'
import './popover.css'
import {PopoverContext} from './PopoverContext'

export interface PopoverProps {
  readonly children: any
  readonly Icon: any
}

export interface PopoverState {
  isVisible: boolean
}

export class Popover extends React.Component<PopoverProps, PopoverState> {
  node: any
  constructor(props: any) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.handleOutsideClick = this.handleOutsideClick.bind(this)

    this.state = {
      isVisible: false
    }
  }

  handleClick() {
    if (!this.state.isVisible) {
      // attach/remove event handler
      document.addEventListener('click', this.handleOutsideClick, false)
    } else {
      document.removeEventListener('click', this.handleOutsideClick, false)
    }

    this.setState((prevState: any) => ({
      isVisible: !prevState.isVisible
    }))
  }

  handleOutsideClick(e: any) {
    // ignore clicks on the component itself
    if (this.node.contains(e.target)) {
      return
    }

    this.handleClick()
  }

  render() {
    return (
      <PopoverContext.Provider
        value={{
          togglePopover: this.handleClick
        }}>
        <div
          className="popover-container"
          ref={node => {
            this.node = node
          }}>
          <div role="presentation" onClick={this.handleClick}>
            {this.props.Icon}
          </div>
          {this.state.isVisible && <div className="popover">{this.props.children}</div>}
        </div>
      </PopoverContext.Provider>
    )
  }
}
export default Popover
