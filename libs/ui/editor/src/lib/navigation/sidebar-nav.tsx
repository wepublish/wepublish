import {
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Children,
  createContext,
  isValidElement,
  ReactElement,
  ReactNode,
  useContext,
  useId,
  useMemo,
} from 'react';
import { MdChevronRight } from 'react-icons/md';
import { Link, useLocation } from 'react-router-dom';

const collectHrefs = (children: ReactNode, found: string[] = []): string[] => {
  Children.toArray(children).forEach(child => {
    if (!isValidElement(child)) {
      return;
    }

    const { href, children: nested } = (
      child as ReactElement<{ href?: string; children?: ReactNode }>
    ).props;

    if (href) {
      found.push(href);
    }

    collectHrefs(nested, found);
  });

  return found;
};

const matches = (href: string, pathname: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const currentHrefFor = (hrefs: string[], pathname: string) =>
  hrefs
    .filter(href => matches(href, pathname))
    .sort((a, b) => b.length - a.length)[0];

const CurrentHrefContext = createContext<string | undefined>(undefined);

export interface SidebarNavProps {
  children: ReactNode;
}

export function SidebarNav({ children }: SidebarNavProps) {
  const { pathname } = useLocation();
  const currentHref = useMemo(
    () => currentHrefFor(collectHrefs(children), pathname),
    [children, pathname]
  );

  return (
    <CurrentHrefContext.Provider value={currentHref}>
      {children}
    </CurrentHrefContext.Provider>
  );
}

export interface SidebarNavItemProps {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function SidebarNavItem({ href, icon, children }: SidebarNavItemProps) {
  const { pathname } = useLocation();
  const currentHref = useContext(CurrentHrefContext);
  const current =
    currentHref === undefined ? matches(href, pathname) : currentHref === href;

  return (
    <ListItemButton
      component={Link}
      to={href}
      selected={current}
      aria-current={current ? 'page' : undefined}
      sx={{ px: 1.5, py: 1, mb: '2px' }}
    >
      {icon && <ListItemIcon sx={{ minWidth: 28 }}>{icon}</ListItemIcon>}
      <ListItemText
        primary={children}
        sx={{ my: 0 }}
        slotProps={{ primary: { variant: 'body2' } }}
      />
    </ListItemButton>
  );
}

const containsHref = (children: ReactNode, pathname: string): boolean =>
  collectHrefs(children).some(href => matches(href, pathname));

export interface SidebarNavMenuProps {
  title: ReactNode;
  icon?: ReactNode;
  open?: boolean;
  openIfCurrent?: boolean;
  onToggle(wasOpen: boolean): void;
  children: ReactNode;
}

export function SidebarNavMenu({
  title,
  icon,
  open,
  openIfCurrent = true,
  onToggle,
  children,
}: SidebarNavMenuProps) {
  const { pathname } = useLocation();
  const containsCurrent = containsHref(children, pathname);
  const isOpen = open || (openIfCurrent && containsCurrent);
  const submenuId = useId();

  return (
    <>
      <ListItemButton
        onClick={() => onToggle(Boolean(isOpen))}
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls={isOpen ? submenuId : undefined}
        data-contains-current={containsCurrent ? 'true' : 'false'}
        sx={{ px: 1.5, py: 1, mb: '2px' }}
      >
        {icon && <ListItemIcon sx={{ minWidth: 28 }}>{icon}</ListItemIcon>}
        <ListItemText
          primary={title}
          sx={{ my: 0 }}
          slotProps={{
            primary: {
              variant: 'body2',
              sx: { fontWeight: containsCurrent ? 600 : undefined },
            },
          }}
        />
        <Box
          component={MdChevronRight}
          sx={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(90deg)' : 'none',
            transition: theme =>
              theme.transitions.create('transform', {
                duration: theme.transitions.duration.shortest,
              }),
          }}
        />
      </ListItemButton>

      <Collapse
        in={isOpen}
        unmountOnExit
      >
        <List
          id={submenuId}
          component="div"
          data-submenu="true"
          sx={{
            ml: 2,
            pl: 1.25,
            py: 0.75,
            borderLeft: '1px solid',
            borderColor: 'var(--wep-shell-border, var(--mui-palette-divider))',
            '& .MuiListItemButton-root': { py: 0.625, mb: '2px' },
          }}
        >
          {children}
        </List>
      </Collapse>
    </>
  );
}
