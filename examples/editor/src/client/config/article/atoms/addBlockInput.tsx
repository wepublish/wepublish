import React from 'react'

import {Dropdown, Icon, IconButton} from 'rsuite'
import {IconNames} from 'rsuite/lib/Icon/Icon'
import {SVGIcon} from 'rsuite/lib/@types/common'

export interface MenuProps {
  readonly items: Array<MenuItem>

  onItemClick(item: MenuItem): void
}

export interface MenuItem {
  readonly id: string
  readonly icon: IconNames | SVGIcon
  readonly label: string
}

export interface AddBlockInputProps {
  menuItems: Array<MenuItem>
  subtle?: boolean
  disabled?: boolean

  onMenuItemClick: (item: MenuItem) => void
}

export function AddBlockInput({menuItems, subtle, disabled, onMenuItemClick}: AddBlockInputProps) {
  return (
    <div
      style={{
        position: 'relative'
      }}>
      <Dropdown
        disabled={disabled}
        renderTitle={() => {
          return <IconButton appearance="primary" icon={<Icon icon="plus" />} circle />
        }}>
        {menuItems.map((item, index) => (
          <Dropdown.Item
            key={index}
            onSelect={event => {
              onMenuItemClick(item)
            }}>
            <Icon icon={item.icon} /> {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown>
    </div>
  )
}
