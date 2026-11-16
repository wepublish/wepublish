import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import { BiSpreadsheet } from 'react-icons/bi';
import { IoArrowRedoOutline } from 'react-icons/io5';

const palette = (theme: Theme) => (theme.vars ?? theme).palette;

/* the badge overhangs on the right: the margin gives that back, so the gap to the next icon looks even */
const Wrapper = styled('span')`
  position: relative;
  display: inline-flex;
  vertical-align: middle;
  font-size: 22px;
  margin-right: 6px;
`;

/**
 * The badge takes the button's colour when monochrome, so a disabled button
 * greys it too. That colour is translucent, so it is painted over an opaque
 * paper base and the sheet underneath stays hidden.
 */
const Badge = styled('span')<{ mono: boolean }>`
  position: absolute;
  right: -6px;
  bottom: -3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-size: 11px;
  background-color: ${({ theme, mono }) =>
    mono ? palette(theme).background.paper : palette(theme).primary.main};
  background-image: ${({ mono }) =>
    mono ? 'linear-gradient(currentColor, currentColor)' : 'none'};
  box-shadow: 0 0 0 2px ${({ theme }) => palette(theme).background.paper};

  & > svg {
    color: ${({ theme, mono }) =>
      mono ?
        palette(theme).background.paper
      : palette(theme).primary.contrastText};
  }
`;

/**
 * The Druckliste: a spreadsheet with a «hand over» arrow badge, stacked the
 * way `InvoiceStatusIcon` puts a status on an invoice. Decorative: the button
 * around it carries the label.
 */
export function PrintListIcon({ disabled = false }: { disabled?: boolean }) {
  return (
    <Wrapper aria-hidden="true">
      <BiSpreadsheet />
      <Badge
        mono={disabled}
        data-tone={disabled ? 'mono' : 'primary'}
      >
        <IoArrowRedoOutline />
      </Badge>
    </Wrapper>
  );
}
