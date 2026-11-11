import { css, Global, Theme } from '@emotion/react';

const calendarStyles = (theme: Theme) => css`
  .react-datepicker-popper {
    z-index: ${theme.zIndex.modal};
    padding-top: ${theme.spacing(0.5)};
  }

  .react-datepicker {
    display: block;
    width: max-content;
    border: 1px solid ${theme.vars.palette.divider};
    border-radius: ${theme.shape.borderRadius + 'px'};
    background-color: ${theme.vars.palette.background.paper};
    box-shadow: var(--wep-elevated-shadow, ${theme.shadows[8]});
    color: ${theme.vars.palette.text.primary};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.body2.fontSize};
    overflow: hidden;
  }

  .react-datepicker__triangle {
    display: none;
  }

  .react-datepicker .react-datepicker__month-container {
    display: inline-block;
    vertical-align: top;
    float: none;
    padding: ${theme.spacing(1)};
  }

  .react-datepicker__header {
    padding: 0;
    border: none;
    background: none;
  }

  .react-datepicker .react-datepicker__current-month,
  .react-datepicker-time__header {
    padding: ${theme.spacing(1)} ${theme.spacing(5)};
    font-size: ${theme.typography.subtitle2.fontSize};
    font-weight: ${theme.typography.subtitle2.fontWeight};
    line-height: 32px;
    color: ${theme.vars.palette.text.primary};
  }

  .react-datepicker .react-datepicker__navigation {
    top: ${theme.spacing(1)};
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: background-color 150ms ${theme.transitions.easing.easeInOut};
  }

  .react-datepicker .react-datepicker__navigation:hover {
    background-color: ${theme.vars.palette.action.hover};
  }

  .react-datepicker .react-datepicker__navigation-icon {
    position: static;
    width: 0;
  }

  .react-datepicker .react-datepicker__navigation-icon::before {
    position: absolute;
    top: 50%;
    left: 50%;
    margin: 0;
  }

  .react-datepicker
    .react-datepicker__navigation--previous
    .react-datepicker__navigation-icon::before {
    transform: translate(-40%, -50%) rotate(225deg);
  }

  .react-datepicker
    .react-datepicker__navigation--next
    .react-datepicker__navigation-icon::before {
    transform: translate(-60%, -50%) rotate(45deg);
  }

  .react-datepicker__navigation--previous {
    left: ${theme.spacing(1)};
  }

  .react-datepicker__navigation--next {
    right: ${theme.spacing(1)};
  }

  .react-datepicker__navigation--next--with-time {
    right: calc(96px + ${theme.spacing(1)});
  }

  .react-datepicker__navigation-icon::before {
    border-color: ${theme.vars.palette.text.secondary};
    border-width: 2px 2px 0 0;
    width: 7px;
    height: 7px;
  }

  .react-datepicker .react-datepicker__day-names {
    margin: ${theme.spacing(0.5)} 0 0;
  }

  .react-datepicker .react-datepicker__day-name {
    width: 36px;
    line-height: 36px;
    margin: 1px;
    color: ${theme.vars.palette.text.secondary};
    font-size: ${theme.typography.caption.fontSize};
    text-transform: uppercase;
  }

  .react-datepicker .react-datepicker__day {
    width: 36px;
    line-height: 36px;
    margin: 1px;
    border-radius: 50%;
    color: ${theme.vars.palette.text.primary};
    transition: background-color 150ms ${theme.transitions.easing.easeInOut};
  }

  .react-datepicker .react-datepicker__day:hover,
  .react-datepicker .react-datepicker__day--keyboard-selected:hover,
  .react-datepicker .react-datepicker__day--today:hover {
    background-color: ${theme.vars.palette.action.hover};
    border-radius: 50%;
  }

  .react-datepicker
    .react-datepicker__day--in-range:not(
      .react-datepicker__day--range-start
    ):not(.react-datepicker__day--range-end):hover,
  .react-datepicker
    .react-datepicker__day--in-selecting-range:not(
      .react-datepicker__day--selecting-range-start
    ):not(.react-datepicker__day--selecting-range-end):hover {
    background-color: rgba(${theme.vars.palette.primary.mainChannel} / 0.2);
    border-radius: 0;
  }

  .react-datepicker .react-datepicker__day--disabled:hover,
  .react-datepicker .react-datepicker__day-name:hover {
    background-color: transparent;
  }

  .react-datepicker .react-datepicker__day--today {
    font-weight: 600;
    box-shadow: inset 0 0 0 1px ${theme.vars.palette.primary.main};
  }

  .react-datepicker .react-datepicker__day--selected,
  .react-datepicker .react-datepicker__day--range-start,
  .react-datepicker .react-datepicker__day--range-end,
  .react-datepicker .react-datepicker__day--selecting-range-start,
  .react-datepicker .react-datepicker__day--selecting-range-end {
    background-color: ${theme.vars.palette.primary.main};
    color: ${theme.vars.palette.primary.contrastText};
  }

  .react-datepicker .react-datepicker__day--selected:hover,
  .react-datepicker .react-datepicker__day--range-start:hover,
  .react-datepicker .react-datepicker__day--range-end:hover {
    background-color: ${theme.vars.palette.primary.dark};
  }

  .react-datepicker
    .react-datepicker__day--in-range:not(
      .react-datepicker__day--range-start
    ):not(.react-datepicker__day--range-end),
  .react-datepicker
    .react-datepicker__day--in-selecting-range:not(
      .react-datepicker__day--selecting-range-start
    ):not(.react-datepicker__day--selecting-range-end) {
    background-color: rgba(${theme.vars.palette.primary.mainChannel} / 0.12);
    color: ${theme.vars.palette.text.primary};
    border-radius: 0;
    margin: 1px 0;
    width: 38px;
  }

  .react-datepicker .react-datepicker__day--keyboard-selected {
    background-color: rgba(${theme.vars.palette.primary.mainChannel} / 0.16);
    color: ${theme.vars.palette.text.primary};
  }

  .react-datepicker .react-datepicker__day--outside-month {
    color: ${theme.vars.palette.text.disabled};
  }

  .react-datepicker .react-datepicker__day--disabled {
    color: ${theme.vars.palette.text.disabled};
    pointer-events: none;
  }

  .react-datepicker__month-read-view,
  .react-datepicker__year-read-view,
  .react-datepicker__month-year-read-view {
    padding: 0 ${theme.spacing(0.5)};
    border-radius: ${theme.shape.borderRadius + 'px'};
    transition: background-color 150ms ${theme.transitions.easing.easeInOut};
  }

  .react-datepicker__month-read-view:hover,
  .react-datepicker__year-read-view:hover,
  .react-datepicker__month-year-read-view:hover {
    background-color: ${theme.vars.palette.action.hover};
  }

  .react-datepicker__month-option,
  .react-datepicker__year-option {
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    transition: background-color 150ms ${theme.transitions.easing.easeInOut};
  }

  .react-datepicker__month-option:hover,
  .react-datepicker__year-option:hover {
    background-color: ${theme.vars.palette.action.hover};
  }

  .react-datepicker__month-dropdown,
  .react-datepicker__year-dropdown {
    border: 1px solid ${theme.vars.palette.divider};
    border-radius: ${theme.shape.borderRadius + 'px'};
    background-color: ${theme.vars.palette.background.paper};
    box-shadow: var(--wep-elevated-shadow, ${theme.shadows[8]});
  }

  .react-datepicker__time-container {
    border-left: 1px solid ${theme.vars.palette.divider};
    width: 96px;
  }

  .react-datepicker__header--time {
    padding: 0;
  }

  .react-datepicker .react-datepicker__time-container .react-datepicker__time {
    background: transparent;
    color: ${theme.vars.palette.text.primary};
  }

  .react-datepicker
    .react-datepicker__time-container
    .react-datepicker__time
    .react-datepicker__time-box {
    width: 96px;
    margin: 0;
  }

  .react-datepicker
    .react-datepicker__time-container
    .react-datepicker__time
    .react-datepicker__time-box
    ul.react-datepicker__time-list
    li.react-datepicker__time-list-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px !important;
    margin: 1px ${theme.spacing(1)};
    border-radius: ${theme.shape.borderRadius + 'px'};
    color: ${theme.vars.palette.text.primary};
    font-size: ${theme.typography.body2.fontSize};
  }

  .react-datepicker
    .react-datepicker__time-container
    ul.react-datepicker__time-list
    li.react-datepicker__time-list-item:hover {
    background-color: ${theme.vars.palette.action.hover} !important;
  }

  .react-datepicker
    .react-datepicker__time-container
    ul.react-datepicker__time-list
    li.react-datepicker__time-list-item--selected,
  .react-datepicker
    .react-datepicker__time-container
    ul.react-datepicker__time-list
    li.react-datepicker__time-list-item--selected:hover {
    background-color: ${theme.vars.palette.primary.main} !important;
    color: ${theme.vars.palette.primary.contrastText};
    font-weight: 600;
  }

  .react-datepicker .react-datepicker__time-list-item--disabled:hover {
    background-color: transparent !important;
  }

  .react-datepicker .react-datepicker__time-list-item--disabled {
    color: ${theme.vars.palette.text.disabled};
  }

  .react-datepicker .react-datepicker__input-time-container {
    display: block;
    width: auto;
    float: none;
    clear: none;
    margin: 0;
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)} ${theme.spacing(1)};
    text-align: left;
  }

  .react-datepicker .react-datepicker-time__caption {
    display: none;
  }

  .react-datepicker .react-datepicker-time__input-container {
    width: auto;
  }

  .react-datepicker
    .react-datepicker__input-time-container
    .react-datepicker-time__input-container
    .react-datepicker-time__input {
    margin: 0;
    width: auto;
  }

  .react-datepicker .react-datepicker-time__input input {
    width: auto;
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.vars.palette.divider};
    border-radius: ${theme.shape.borderRadius + 'px'};
    background-color: transparent;
    color: ${theme.vars.palette.text.primary};
    font-family: inherit;
    font-size: ${theme.typography.body2.fontSize};
    transition: border-color 150ms ${theme.transitions.easing.easeInOut};
  }

  .react-datepicker .react-datepicker-time__input input:hover {
    border-color: ${theme.vars.palette.text.primary};
  }

  .react-datepicker .react-datepicker-time__input input:focus {
    outline: none;
    border-color: ${theme.vars.palette.primary.main};
    box-shadow: inset 0 0 0 1px ${theme.vars.palette.primary.main};
  }

  .react-datepicker
    .react-datepicker-time__input
    input::-webkit-calendar-picker-indicator {
    filter: ${theme.palette.mode === 'dark' ? 'invert(1)' : 'none'};
    opacity: 0.6;
    cursor: pointer;
  }

  .react-datepicker
    .react-datepicker-time__input
    input::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }

  .react-datepicker .react-datepicker__children-container {
    display: block;
    width: auto;
    margin: 0;
    padding: 0 ${theme.spacing(1)} ${theme.spacing(1)};
  }

  .react-datepicker__aria-live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
`;

export function MaterialCalendarStyles() {
  return <Global styles={calendarStyles} />;
}
