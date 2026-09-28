// Country picker of the /abos form. A native <select> with 250 countries
// opens a list as tall as the window, and its height cannot be styled, so
// this is a small combobox instead: it looks like the form's selects
// (webform.js `Select`), opens a short scrolling list with the neighbouring
// countries first, and filters as you type. Only names from the list are
// accepted: we.publish stores the German country name.
import React from 'react';

import { IconButton } from './primitives';

// shown first, in this order
const PREFERRED = [
  'Schweiz',
  'Deutschland',
  'Österreich',
  'Liechtenstein',
  'Frankreich',
  'Italien',
];

const fold = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function matches(query, countries) {
  const q = fold(query.trim());
  if (!q) return countries;
  const starts = countries.filter(c => fold(c).startsWith(q));
  const contains = countries.filter(
    c => !fold(c).startsWith(q) && fold(c).includes(q)
  );
  return [...starts, ...contains];
}

export class CountrySelect extends React.Component {
  state = {
    value: this.props.data['#default_value'] || '',
    query: null,
    open: false,
    active: 0,
  };

  list = React.createRef();

  countries = (() => {
    const all = Object.keys(this.props.data['#options']);
    return [
      ...PREFERRED.filter(c => all.includes(c)),
      ...all.filter(c => !PREFERRED.includes(c)),
    ];
  })();

  componentDidMount() {
    const data = this.props.data;
    this.props.passValuesToParent(data['#name'], this.state.value);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.open &&
      (this.state.active !== prevState.active || !prevState.open)
    ) {
      this.list.current?.children[this.state.active]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }

  options() {
    return this.state.query == null ?
        this.countries
      : matches(this.state.query, this.countries);
  }

  open = () => {
    if (this.state.open) return;
    const index = this.countries.indexOf(this.state.value);
    this.setState({ open: true, query: null, active: Math.max(0, index) });
  };

  close = () => this.setState({ open: false, query: null });

  select = country => {
    this.setState({ value: country, open: false, query: null });
    this.props.passValuesToParent(this.props.data['#name'], country);
  };

  handleChange = event =>
    this.setState({ query: event.target.value, open: true, active: 0 });

  handleKeyDown = event => {
    const options = this.options();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.state.open) return this.open();
        return this.setState({
          active: Math.min(options.length - 1, this.state.active + 1),
        });
      case 'ArrowUp':
        event.preventDefault();
        return this.setState({ active: Math.max(0, this.state.active - 1) });
      case 'Enter':
        if (this.state.open) {
          event.preventDefault();
          if (options[this.state.active])
            this.select(options[this.state.active]);
        }
        return;
      case 'Escape':
        return this.close();
      default:
    }
  };

  // leaving the field keeps a typed name only if it is (unambiguously) a country
  handleBlur = () => {
    const { query } = this.state;
    if (query != null) {
      const exact = this.countries.find(c => fold(c) === fold(query.trim()));
      const [only, ...more] = matches(query, this.countries);
      const country = exact ?? (only && !more.length ? only : null);
      if (country) return this.select(country);
    }
    this.close();
  };

  render() {
    const data = this.props.data;
    const { value, query, open, active } = this.state;
    const options = open ? this.options() : [];
    const listId = `${data['#id']}-list`;

    return (
      <div className="fancy-select country-select">
        <label
          className="label label--select"
          htmlFor={data['#id']}
        >
          {data['#title']}
          {data['#required'] && '*'}
        </label>
        <input
          id={data['#id']}
          className="country-select__input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && options[active] ? `${listId}-${active}` : undefined
          }
          autoComplete="country-name"
          required={data['#required']}
          value={query ?? value}
          onChange={this.handleChange}
          onFocus={this.open}
          onClick={this.open}
          onKeyDown={this.handleKeyDown}
          onBlur={this.handleBlur}
        />
        <IconButton type="down" />
        {open && (
          <ul
            className="country-select__list"
            id={listId}
            role="listbox"
            ref={this.list}
          >
            {options.map((country, index) => (
              <li
                key={country}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={country === value}
                className={`country-select__option${index === active ? ' active' : ''}${
                  query == null && index === PREFERRED.length - 1 ?
                    ' last-preferred'
                  : ''
                }`}
                // mousedown: select before the input's blur closes the list
                onMouseDown={event => {
                  event.preventDefault();
                  this.select(country);
                }}
                onMouseEnter={() => this.setState({ active: index })}
              >
                {country}
              </li>
            ))}
            {!options.length && (
              <li className="country-select__empty">Kein Land gefunden</li>
            )}
          </ul>
        )}
      </div>
    );
  }
}
