// Drupal webform renderer of the live site, ported from its bundle
// (functions Vi, zi, Ui, Wi, Yi, no, co, uo, lo, mo, yo, wo, So, No).
// The field components are used by the we.publish subscribe form
// (components/subscribe-form.js), which feeds them the Drupal data shape.
// The Drupal forms themselves (Kontakt, Newsletter) are not available on
// we.publish and render a placeholder (`Webform`).
import React from 'react';

import { FORM_ICONS } from '../lib/icons';
import * as S from '../lib/styles';
import { IconButton } from './primitives';

const isField = (value, key) => key.charAt(0) !== '#';

function pickBy(predicate, object) {
  return Object.fromEntries(
    Object.entries(object).filter(([key, value]) => predicate(value, key))
  );
}

// bundle class `Vi`
class TextInput extends React.Component {
  state = { value: '', open: false, valid: true };

  handleChange = event => {
    const value = event.target.value;
    this.setState({ value });
    this.props.passValuesToParent(this.props.data['#name'], value);
  };

  handleFocus = () => this.setState({ open: true });

  handleBlur = () => {
    if (this.state.value === '') {
      this.setState({ open: false });
    }
  };

  handleInvalid = () => this.setState({ valid: false });

  handleKeyDown = () => this.setState({ valid: true });

  componentDidMount() {
    const data = this.props.data;
    this.props.passValuesToParent(data['#name'], data['#value']);
  }

  render() {
    const data = this.props.data;
    const { open } = this.state;
    const validity = this.state.valid ? ' valid' : ' invalid';
    const required = data['#required'] || data['#_required'];

    return (
      <div className={`input__wrapper--text${validity}`}>
        <label
          className={`label label--text-input ${open && ' label--open'}`}
          htmlFor={data['#id']}
        >
          {data['#title']}
          {required && '*'}
        </label>
        <input
          type={data['#type']}
          id={data['#id']}
          name={data['#name']}
          value={this.state.value}
          size={data['#size']}
          maxLength={data['#maxlength']}
          required={data['#required'] || data['#_required']}
          aria-required={data['#required']}
          autoComplete={data['#name']}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onInvalid={this.handleInvalid}
          onKeyDown={this.handleKeyDown}
        />
      </div>
    );
  }
}

// bundle class `zi`
class TextArea extends React.Component {
  state = { value: '', open: false };

  handleChange = event => {
    const value = event.target.value;
    this.setState({ value });
    this.props.passValuesToParent(this.props.data['#name'], value);
  };

  handleFocus = () => this.setState({ open: true });

  handleBlur = () => {
    if (this.state.value === '') {
      this.setState({ open: false });
    }
  };

  componentDidMount() {
    const data = this.props.data;
    this.props.passValuesToParent(data['#name'], data['#value']);
  }

  render() {
    const data = this.props.data;

    return (
      <div className="input__wrapper--text input__wrapper--text-area">
        <label
          className={`label label--text-input ${this.state.open && ' label--open'}`}
          htmlFor={data['#id']}
        >
          {data['#title']}
          {data['#required'] && '*'}
        </label>
        <textarea
          id={data['#id']}
          className="input--text"
          name={data['#name']}
          rows={data['#rows']}
          cols={data['#cols']}
          value={this.state.value}
          autoComplete={data['#name']}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        />
      </div>
    );
  }
}

// bundle function `Ui`
function FormIcon({ type, value }) {
  return (
    <img
      className="form-icon"
      src={FORM_ICONS[type][value.toString()]}
      alt=""
    />
  );
}

// bundle class `Wi`
class Checkbox extends React.Component {
  state = { value: this.props.data['#default_value'] || false };

  handleChange = () => {
    this.setState({ value: !this.state.value }, () => {
      this.props.passValuesToParent(
        this.props.data['#name'],
        this.state.value ? 1 : 0
      );

      if (this.props.toggleGiftForm) {
        this.props.toggleGiftForm(this.state.value);
      }
    });
  };

  componentDidMount() {
    const data = this.props.data;
    this.props.passValuesToParent(data['#name'], data['#value']);
  }

  render() {
    const data = this.props.data;

    return (
      <div
        className="input__wrapper--checkbox"
        role="checkbox"
        aria-checked={this.state.value}
      >
        <input
          type="checkbox"
          id={data['#id']}
          name={data['#name']}
          checked={this.state.value}
          onChange={this.handleChange}
        />
        <label
          htmlFor={data['#id']}
          className="input--checkbox"
        >
          <FormIcon
            type="checkbox"
            value={this.state.value}
          />
          {data['#title']}
          {data['#required'] && '*'}
        </label>
      </div>
    );
  }
}

// bundle class `Yi`
class Radios extends React.Component {
  state = { value: this.props.data['#default_value'] || null };

  handleChange = value => {
    this.setState({ value }, () =>
      this.props.passValuesToParent(this.props.data['#name'], value)
    );
  };

  componentDidMount() {
    const data = this.props.data;
    this.props.passValuesToParent(data['#name'], data['#value']);
  }

  render() {
    const data = this.props.data;
    const options = pickBy(isField, data);

    return (
      <div
        role="radiogroup"
        aria-labelledby={data['#name']}
      >
        {Object.entries(options).map(([value, option], index) => {
          const checked = this.state.value === value;

          return (
            <div
              key={value}
              className="input__wrapper--radio"
              role="radio"
              tabIndex={index === 0 ? 0 : -1}
              aria-checked={checked}
            >
              <label className="input--radio">
                <FormIcon
                  type="radio"
                  value={checked}
                />
                <input
                  name={option['#name']}
                  type={option['#type']}
                  value={value}
                  checked={checked}
                  required
                  onChange={() => this.handleChange(value)}
                />
                {option['#title']}
              </label>
            </div>
          );
        })}
        <p
          dangerouslySetInnerHTML={{
            __html: data['#description']?.['#markup'] ?? null,
          }}
        />
      </div>
    );
  }
}

// bundle class `no`
class Select extends React.Component {
  state = { value: '' };

  handleChange = event => {
    const value = event.target.value;
    this.setState({ value });
    this.props.passValuesToParent(this.props.data['#name'], value);
  };

  componentDidMount() {
    const data = this.props.data;
    this.props.passValuesToParent(data['#name'], data['#default_value']);
  }

  render() {
    const data = this.props.data;

    return (
      <div className="fancy-select">
        <label
          className="label label--select"
          htmlFor={data['#id']}
        >
          {data['#title']}
          {data['#required'] && '*'}
        </label>
        <select
          id={data['#id']}
          name={data['#name']}
          required={data['#required']}
          aria-required={data['#required']}
          value={this.state.value || data['#default_value']}
          onChange={this.handleChange}
          autoComplete={data['#name']}
        >
          {Object.keys(data['#options']).map(key => (
            <option
              key={key}
              value={key}
            >
              {data['#options'][key]}
            </option>
          ))}
        </select>
        <IconButton type="down" />
      </div>
    );
  }
}

// bundle function `co`
function Fieldset({ data, passValuesToParent }) {
  return (
    <fieldset className={data['#id']}>
      <FieldGroup
        passValuesToParent={passValuesToParent}
        data={data}
      />
    </fieldset>
  );
}

// bundle class `uo`: the gift checkbox reveals the recipient fields
class GiftGroup extends React.Component {
  state = { showGiftForm: false };

  toggleGiftForm = showGiftForm => this.setState({ showGiftForm });

  render() {
    const { passValuesToParent, data } = this.props;
    const { gift, ...rest } = data;

    return (
      <div>
        <Field
          toggleGiftForm={this.toggleGiftForm}
          passValuesToParent={passValuesToParent}
          data={gift}
        />
        {this.state.showGiftForm && (
          <FieldGroup
            passValuesToParent={passValuesToParent}
            data={rest}
          />
        )}
      </div>
    );
  }
}

// bundle class `lo`
function FieldsetBlock({ data, passValuesToParent }) {
  return (
    <div>
      <div>
        <h3>{data['#title']}</h3>
        {data['#description'] && <p>{data['#description']['#markup']}</p>}
        {data['#id'] === 'edit-gift-group' ?
          <GiftGroup
            passValuesToParent={passValuesToParent}
            data={data}
          />
        : <Fieldset
            passValuesToParent={passValuesToParent}
            data={data}
          />
        }
      </div>
      <br />
      <br />
    </div>
  );
}

// bundle class `mo`
export function Submit({ pending }) {
  return (
    <div className={`${S.webformSubmit.submit}${pending ? ' pending' : ''}`}>
      <input
        type="submit"
        disabled={pending}
        value={pending ? 'Bitte warten...' : 'Senden'}
      />
    </div>
  );
}

// bundle class `yo`: dispatches a Drupal render-array element by #type
function Field({ data, passValuesToParent, toggleGiftForm }) {
  if (data['#access'] === false) {
    return null;
  }

  const props = { passValuesToParent, data };

  switch (data['#type']) {
    // password, date, number: not in the live Drupal forms; used by the
    // subscribe form
    case 'textfield':
    case 'email':
    case 'password':
    case 'date':
    case 'number':
      return <TextInput {...props} />;
    case 'fieldset':
      return <FieldsetBlock {...props} />;
    case 'textarea':
      return <TextArea {...props} />;
    case 'checkbox':
      return (
        <Checkbox
          toggleGiftForm={toggleGiftForm}
          {...props}
        />
      );
    case 'radios':
      return <Radios {...props} />;
    case 'select':
      return <Select {...props} />;
    case 'webform_actions':
      return null;
    // not in the live Drupal forms: a component of the subscribe form (e.g.
    // CountrySelect) that takes the same props as the fields above
    case 'component': {
      const Component = data['#component'];
      return <Component {...props} />;
    }
    case 'container':
    case 'webform_address':
      return <FieldGroup {...props} />;
    default:
      return <span>no handling for &apos;{data['#type']}&apos;</span>;
  }
}

// bundle classes `wo`/`So`
export function FieldGroup({ data, passValuesToParent }) {
  const fields = pickBy(isField, data);
  const children = Object.keys(fields).map(key => (
    <Field
      key={key}
      passValuesToParent={passValuesToParent}
      data={fields[key]}
    />
  ));

  return data['#attributes']?.['#layout'] ?
      <div className="layout--two-col">{children}</div>
    : children;
}

// bundle function `No`
export function Confirmation({ data }) {
  const text =
    data.webform_id === 'newsletter' ?
      'Es freut uns, Sie in unserem Newsletter Verteiler zu wissen.'
    : data.webform_id === 'abo' ?
      'Es freut uns, Sie zu unseren Abonnenten zählen zu können.'
    : '';

  return (
    <div className={S.webformConfirmation.root}>
      <h3
        className="paragraph--h3 h3"
        dangerouslySetInnerHTML={{ __html: 'Vielen Dank!' }}
      />
      <p dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

// Replaces the Drupal webform (bundle class `Lo`): Kontakt and Newsletter
// have no we.publish counterpart yet (Newsletter moves to Mailchimp later).
export const WEBFORM_PLACEHOLDER =
  'Dieses Formular ist zurzeit nicht verfügbar.';

export function Webform() {
  return (
    <div className={S.webform.root}>
      <p>{WEBFORM_PLACEHOLDER}</p>
    </div>
  );
}
