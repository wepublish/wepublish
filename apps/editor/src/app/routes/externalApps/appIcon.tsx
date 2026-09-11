import { MdExtension } from 'react-icons/md';

import { ICON_REGISTRY } from './iconRegistry';

export interface AppIconProps {
  iconName?: string | null;
}

/** The icon an external app was registered with, or a generic one. */
export function AppIcon({ iconName }: AppIconProps) {
  if (!iconName || !ICON_REGISTRY[iconName]) {
    return <MdExtension />;
  }

  const RegisteredIcon = ICON_REGISTRY[iconName].icon;
  return <RegisteredIcon />;
}
