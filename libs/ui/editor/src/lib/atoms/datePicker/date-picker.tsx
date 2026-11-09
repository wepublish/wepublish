import styled from '@emotion/styled';
import { Button, IconButton, InputAdornment, TextField } from '@mui/material';
import { useForkRef } from '@mui/material/utils';
import {
  createContext,
  forwardRef,
  KeyboardEvent,
  ReactNode,
  Ref,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import ReactDatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { MdClear, MdEvent } from 'react-icons/md';

import { MaterialCalendarStyles } from './material-calendar';
import { CalendarTimeInput } from './time-input';

import 'react-datepicker/dist/react-datepicker.css';

const FullWidthWrapper = styled.div`
  width: 100%;

  .react-datepicker-wrapper {
    width: 100%;
  }
`;

const InlineWrapper = styled.div`
  display: contents;
`;

// The calendar has to live inside the surrounding dialog or drawer: MUI's
// focus trap pulls focus out of anything rendered outside of it, and a
// calendar portaled to the body ends up behind dialogs opened later on.
const MODAL_ROOT = '.MuiDialog-container, .MuiDrawer-paper';

const PopperAnchorContext = createContext<HTMLElement | null>(null);

function PopperContainer({ children }: { children?: ReactNode }) {
  const anchor = useContext(PopperAnchorContext);
  const host = anchor?.closest<HTMLElement>(MODAL_ROOT) ?? document.body;

  return createPortal(children, host);
}

const CloseCalendarContext = createContext<() => void>(() => undefined);

export const useCloseCalendar = () => useContext(CloseCalendarContext);

export const DatePickerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(1)};
  border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
`;

export const DatePickerShortcuts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export function DatePickerDone() {
  const { t } = useTranslation();
  const close = useCloseCalendar();

  return (
    <Button
      size="small"
      variant="contained"
      onMouseDown={event => event.preventDefault()}
      onClick={close}
    >
      {t('dateTimePicker.done')}
    </Button>
  );
}

export const DATE_FORMAT = 'dd.MM.yyyy';
export const DATE_TIME_FORMAT = 'dd.MM.yyyy HH:mm';

type FieldProps = {
  id?: string;
  className?: string;
  label?: ReactNode;
  placeholder?: string;
  helperText?: ReactNode;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  name?: string;
  'aria-labelledby'?: string;
  inputRef?: Ref<HTMLInputElement>;
  onClear?: () => void;
};

const PickerInput = forwardRef(function PickerInput(
  {
    label,
    placeholder,
    helperText,
    error,
    disabled,
    fullWidth,
    size,
    name,
    id,
    onClear,
    value,
    inputRef,
    ...props
  }: FieldProps & { value?: string },
  ref: Ref<HTMLInputElement>
) {
  const { t } = useTranslation();
  const forkedRef = useForkRef(ref, inputRef);

  return (
    <TextField
      {...props}
      inputRef={forkedRef}
      value={value ?? ''}
      label={label}
      placeholder={placeholder}
      helperText={helperText}
      error={error}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      name={name}
      id={id}
      slotProps={{
        htmlInput: {
          'aria-labelledby': props['aria-labelledby'],
          'aria-haspopup': 'dialog',
          autoComplete: 'off',
        },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              {onClear && value ?
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={t('dateTimePicker.clear')}
                  disabled={disabled}
                  onMouseDown={event => event.stopPropagation()}
                  onClick={event => {
                    event.stopPropagation();
                    onClear();
                  }}
                >
                  <MdClear />
                </IconButton>
              : <MdEvent />}
            </InputAdornment>
          ),
        },
      }}
    />
  );
});

export interface DatePickerProps extends FieldProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  withTime?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disableFuture?: boolean;
  clearable?: boolean;
  children?: ReactNode;
}

function Wrapper({
  fullWidth,
  isOpen,
  children,
}: {
  fullWidth?: boolean;
  isOpen: () => boolean;
  children: ReactNode;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const Element = fullWidth ? FullWidthWrapper : InlineWrapper;

  const keepEscapeInCalendar = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen()) {
      event.stopPropagation();
    }
  };

  return (
    <Element
      ref={setAnchor}
      onKeyDown={keepEscapeInCalendar}
    >
      <PopperAnchorContext.Provider value={anchor}>
        {children}
      </PopperAnchorContext.Provider>
    </Element>
  );
}

const popperProps = { strategy: 'fixed' } as const;

export function DatePicker({
  value,
  onChange,
  withTime,
  minDate,
  maxDate,
  disableFuture,
  clearable,
  children,
  ...field
}: DatePickerProps) {
  const picker = useRef<ReactDatePicker>(null);
  const close = useCallback(() => picker.current?.setOpen(false), []);
  const isOpen = useCallback(
    () => Boolean(picker.current?.isCalendarOpen()),
    []
  );

  return (
    <Wrapper
      fullWidth={field.fullWidth}
      isOpen={isOpen}
    >
      <MaterialCalendarStyles />

      <ReactDatePicker
        ref={picker}
        selected={value}
        onChange={(date: Date | null) => onChange(date)}
        dateFormat={withTime ? DATE_TIME_FORMAT : DATE_FORMAT}
        showTimeInput={withTime}
        timeInputLabel=""
        customTimeInput={<CalendarTimeInput />}
        minDate={minDate}
        maxDate={disableFuture ? new Date() : maxDate}
        disabled={field.disabled}
        id={field.id}
        name={field.name}
        placeholderText={field.placeholder}
        ariaLabelledBy={field['aria-labelledby']}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        popperContainer={PopperContainer}
        popperProps={popperProps}
        customInput={
          <PickerInput
            {...field}
            onClear={clearable ? () => onChange(null) : undefined}
          />
        }
      >
        <CloseCalendarContext.Provider value={close}>
          {children}
        </CloseCalendarContext.Provider>
      </ReactDatePicker>
    </Wrapper>
  );
}

export interface DateRangePickerProps extends FieldProps {
  from: Date | null;
  to: Date | null;
  onChange: (range: { from: Date | null; to: Date | null }) => void;
  disableFuture?: boolean;
  clearable?: boolean;
  children?: ReactNode;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  disableFuture,
  clearable,
  children,
  ...field
}: DateRangePickerProps) {
  const picker = useRef<ReactDatePicker>(null);
  const close = useCallback(() => picker.current?.setOpen(false), []);
  const isOpen = useCallback(
    () => Boolean(picker.current?.isCalendarOpen()),
    []
  );

  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  return (
    <Wrapper
      fullWidth={field.fullWidth}
      isOpen={isOpen}
    >
      <MaterialCalendarStyles />

      <ReactDatePicker
        ref={picker}
        selectsRange
        startDate={pendingStart ?? from ?? undefined}
        endDate={pendingStart ? undefined : (to ?? undefined)}
        onChange={([start, end]: [Date | null, Date | null]) => {
          if (start && !end) {
            setPendingStart(start);
            return;
          }

          setPendingStart(null);
          onChange({ from: start, to: end });
        }}
        dateFormat={DATE_FORMAT}
        maxDate={disableFuture ? new Date() : undefined}
        disabled={field.disabled}
        id={field.id}
        name={field.name}
        placeholderText={field.placeholder}
        ariaLabelledBy={field['aria-labelledby']}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        popperContainer={PopperContainer}
        popperProps={popperProps}
        monthsShown={2}
        onCalendarClose={() => setPendingStart(null)}
        customInput={
          <PickerInput
            {...field}
            onClear={
              clearable ? () => onChange({ from: null, to: null }) : undefined
            }
          />
        }
      >
        <CloseCalendarContext.Provider value={close}>
          {children}
        </CloseCalendarContext.Provider>
      </ReactDatePicker>
    </Wrapper>
  );
}
