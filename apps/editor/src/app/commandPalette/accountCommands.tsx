import { MdLogout } from 'react-icons/md';

import type { CommandDefinition } from './commandDefinition';

export const ACCOUNT_COMMANDS: CommandDefinition[] = [
  {
    id: 'logout',
    titleKey: 'navbar.logout',
    icon: <MdLogout />,
    perform: ({ navigate }) => navigate('/logout'),
  },
];
