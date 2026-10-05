import styled from '@emotion/styled';
import { Drawer } from '@mui/material';
import { Button, IconButton } from '@wepublish/website/builder';
import { MdClose } from 'react-icons/md';
import { ReactNode } from 'react';

export const BkaFilterDrawer = styled(Drawer)`
  & .MuiDrawer-paper {
    background-color: #111111;
    background-image: none;
    box-shadow: rgba(0, 0, 0, 0.075) 0 2px 4px 0;
  }
`;

export const BkaFilterPanelSurface = styled('div')`
  display: flex;
  flex-direction: column;
  width: min(100vw, 400px);
  min-height: 100%;
  background-color: #111111;
  color: ${({ theme }) => theme.palette.common.white};
  font-family: ${({ theme }) => theme.typography.body1.fontFamily};
`;

export const BkaFilterPanelHeader = styled('div')`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(2)};
`;

export const BkaFilterPanelTitle = styled('h2')`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.h5.fontSize};
  font-weight: 400;
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};
`;

export const BkaFilterPanelClose = styled(IconButton)`
  position: absolute;
  top: ${({ theme }) => theme.spacing(2)};
  right: ${({ theme }) => theme.spacing(2)};
  width: 32px;
  height: 32px;
  padding: ${({ theme }) => theme.spacing(1)};
  color: inherit;

  &:hover,
  &:focus-visible {
    background-color: rgba(255, 255, 255, 0.12);
  }
`;

export const BkaFilterPanelBody = styled('div')`
  flex: 1;
  overflow-y: auto;
  padding-top: ${({ theme }) => theme.spacing(2)};
  padding-bottom: ${({ theme }) => theme.spacing(3)};
`;

export const BkaFilterGroup = styled('fieldset')`
  margin: 0;
  padding: 0;
  border: 0;

  & + & {
    margin-top: ${({ theme }) => theme.spacing(3.5)};
  }
`;

export const BkaFilterGroupTitle = styled('legend')`
  margin-bottom: ${({ theme }) => theme.spacing(1.5)};
  padding: 0 ${({ theme }) => theme.spacing(2.5)};
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  font-weight: 700;
  line-height: ${({ theme }) => theme.typography.h6.lineHeight};
`;

export const BkaFilterOption = styled('div')`
  position: relative;
  margin-left: ${({ theme }) => theme.spacing(2.5)};
  padding-left: 28px;
  min-height: 24px;

  & + & {
    margin-top: ${({ theme }) => theme.spacing(2)};
  }
`;

export const BkaFilterCheckbox = styled('input')`
  position: absolute;
  top: 2px;
  left: 0;
  width: 20px;
  height: 20px;
  margin: 0;
  appearance: none;
  border: 1px solid ${({ theme }) => theme.palette.common.black};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.palette.common.white};
  background-position: center;
  background-repeat: no-repeat;
  background-size: 14px 10px;
  cursor: pointer;

  &:checked {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 14 10'%3E%3Cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M1 5l3.5 3.5L13 1'/%3E%3C/svg%3E");
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.common.white};
    outline-offset: 2px;
  }
`;

export const BkaFilterLabel = styled('label')`
  display: inline-block;
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  font-weight: 400;
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};
  cursor: pointer;
`;

export const BkaFilterActions = styled('div')`
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: max-content;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: 0 ${({ theme }) => theme.spacing(2)}
    ${({ theme }) => theme.spacing(2)};
  text-align: center;
  box-shadow: 0 -6px 15px 0 #111111;
`;

export const BkaFilterSubmit = styled(Button)`
  border-color: ${({ theme }) => theme.palette.common.white};
  background-color: ${({ theme }) => theme.palette.common.black};

  &:hover,
  &:focus {
    border-color: ${({ theme }) => theme.palette.common.white};
    background-color: ${({ theme }) => theme.palette.common.black};
  }
`;

export const BkaFilterReset = styled(Button)`
  &:hover,
  &:focus {
    text-decoration: none;
  }
`;

export type BkaFilterPanelProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onReset: () => void;
  children: ReactNode;
  id?: string;
};

export const BkaFilterPanel = ({
  open,
  onClose,
  onSubmit,
  onReset,
  children,
  id,
}: BkaFilterPanelProps) => (
  <BkaFilterDrawer
    anchor="left"
    open={open}
    onClose={onClose}
  >
    <BkaFilterPanelSurface id={id}>
      <BkaFilterPanelHeader>
        <BkaFilterPanelTitle>Filter</BkaFilterPanelTitle>

        <BkaFilterPanelClose
          type="button"
          onClick={onClose}
          aria-label="Filter schliessen"
        >
          <MdClose size={16} />
        </BkaFilterPanelClose>
      </BkaFilterPanelHeader>

      <BkaFilterPanelBody>{children}</BkaFilterPanelBody>

      <BkaFilterActions>
        <BkaFilterSubmit
          variant="outlined"
          color="inherit"
          type="button"
          onClick={onSubmit}
        >
          Suchen
        </BkaFilterSubmit>

        <BkaFilterReset
          variant="text"
          color="inherit"
          type="button"
          onClick={onReset}
        >
          Zurücksetzen
        </BkaFilterReset>
      </BkaFilterActions>
    </BkaFilterPanelSurface>
  </BkaFilterDrawer>
);
