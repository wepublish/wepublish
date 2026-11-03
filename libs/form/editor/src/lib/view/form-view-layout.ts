import styled from '@emotion/styled';
import {
  Card,
  CardContent,
  DialogContentText,
  FormGroup,
  FormLabel,
  Typography,
} from '@mui/material';
import {
  DrawerBody,
  DrawerHeader,
  FormFields,
  Link,
} from '@wepublish/ui/editor';
import { MdExpandMore } from 'react-icons/md';

export const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
`;

export const PageForm = styled('form')`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
`;

export const StickyHeader = styled.div`
  position: sticky;
  top: calc(-1 * var(--wep-page-padding-y, 0px));
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1, 3)};
  margin: calc(-1 * var(--wep-page-padding-y, 0px))
    calc(-1 * var(--wep-page-padding-x, 0px)) 0;
  padding: ${({ theme }) => theme.spacing(2)} var(--wep-page-padding-x, 0px);
  background: ${({ theme }) => theme.vars.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};
`;

export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

export const TitleText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const Subtitle = styled(Typography)`
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export const BackAnchor = styled(Link)`
  display: flex;
  color: inherit;

  svg {
    font-size: 28px;
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-left: auto;
`;

export const Body = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  align-content: start;
  width: 100%;
  min-width: 0;
  max-width: var(--wep-form-max-width, 760px);
  padding-top: var(--wep-form-padding-top, ${({ theme }) => theme.spacing(3)});

  &[data-wide='true'] {
    max-width: var(--wep-form-max-width, 1200px);
  }

  & * {
    scroll-margin-top: calc(
      var(--wep-sticky-top, 0px) + var(--wep-page-padding-y, 0px) +
        ${({ theme }) => theme.spacing(3)}
    );
  }
`;

export const Columns = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(4)};
  min-width: 0;
`;

export const MainColumn = styled.div`
  flex: 999 1 0;
  min-inline-size: 60%;
  display: flex;
  flex-direction: column;
`;

export const AsidePanel = styled.div`
  flex: 1 1 320px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(3)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.vars.palette.background.default};
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${({ theme }) => theme.spacing(4)};
  align-items: start;
  min-width: 0;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(var(--wep-form-card-columns, 2), 1fr);
  }
`;

export const SectionCard = styled(Card)`
  min-width: 0;

  &[data-span='full'] {
    grid-column: 1 / -1;
  }
` as typeof Card;

export const SectionCardContent = styled(CardContent)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const CardTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const CardTitle = styled(Typography)`
  margin: 0;
` as typeof Typography;

export const SectionRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2.5)};
  min-width: 0;

  & + & {
    margin-top: ${({ theme }) => theme.spacing(4)};
    padding-top: ${({ theme }) => theme.spacing(4)};
    border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }
`;

export const SectionFields = styled(FormFields)`
  & > .MuiFormControl-root:first-child:has(> .MuiFormControlLabel-root),
  &
    > .MuiFormGroup-root:first-child:has(
      > .MuiFormControl-root:first-child > .MuiFormControlLabel-root
    ) {
    margin-top: -14px;
  }
`;

export const CardFields = styled(SectionFields)`
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export const SectionTitle = styled(Typography)`
  font-weight: 600;
  margin: 0;
` as typeof Typography;

export const SectionDescription = styled(Typography)`
  max-width: 72ch;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export const SectionToggle = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
    border-radius: calc(${({ theme }) => theme.shape.borderRadius}px * 0.75);
  }
`;

export const ToggleEnd = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const Chevron = styled(MdExpandMore)`
  font-size: 24px;
  flex-shrink: 0;
  transition: transform 150ms;

  &[data-open='true'] {
    transform: rotate(180deg);
  }
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: ${({ theme }) => theme.spacing(3, 2)};
  align-items: start;
  min-width: 0;
`;

export const ToggleGroup = styled(FormGroup)`
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export const ToggleGroupTitle = styled(FormLabel)`
  font-size: ${({ theme }) => theme.typography.subtitle2.fontSize};
  font-weight: 600;
  color: ${({ theme }) => theme.vars.palette.text.primary};
` as typeof FormLabel;

export const PanelHeader = styled(DrawerHeader)`
  flex-wrap: wrap;
`;

export const PanelBody = styled(DrawerBody)`
  --wep-form-max-width: none;
  --wep-form-padding-top: 0px;
  --wep-form-card-columns: 1;
`;

export const ConfirmDescription = styled(DialogContentText)`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

export const ChangeArrow = styled.span`
  display: inline-flex;
  vertical-align: middle;
  margin: ${({ theme }) => theme.spacing(0, 0.5)};
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export const Before = styled.del`
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export const After = styled.ins`
  text-decoration: none;
  font-weight: 600;
`;
