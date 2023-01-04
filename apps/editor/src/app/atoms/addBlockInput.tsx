import React from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd} from 'react-icons/md'
import {Dropdown, IconButton} from 'rsuite'

export interface MenuProps {
  readonly items: Array<MenuItem>

  onItemClick(item: MenuItem): void
}

export interface MenuItem {
  readonly id: string
  readonly icon: React.ReactElement
  readonly label: string
}

export interface AddBlockInputProps {
  menuItems: Array<MenuItem>
  subtle?: boolean
  disabled?: boolean

  onMenuItemClick: (item: MenuItem) => void
}

export function AddBlockInput({menuItems, subtle, disabled, onMenuItemClick}: AddBlockInputProps) {
  const {t} = useTranslation()
  return (
    <div
      style={{
        position: 'relative'
      }}>
      <Dropdown
        disabled={disabled}
        renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
          <IconButton {...props} ref={ref} icon={<MdAdd />} circle appearance="primary" />
        )}>
        {menuItems.map((item, index) => (
          <Dropdown.Item
            key={index}
            onSelect={event => {
              onMenuItemClick(item)
            }}>
            {item.icon} {t(item.label)}
          </Dropdown.Item>
        ))}
      </Dropdown>
    </div>
  )
}
