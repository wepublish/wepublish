// The /abos form: the SubscribeBlock of the we.publish page `abos`, working
// like the subscribe form of abos.neuewege.ch/mitmachen, drawn with the ported Drupal
// webform components so it looks like the live Abo form. Plans, intervals,
// amounts, payment methods, goodies and the personal fields all follow the
// block and its member plans; the logic mirrors the we.publish website's
// libs/membership/website/src/lib/subscribe/subscribe.tsx.
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import React from 'react';

import * as S from '../lib/styles';
import countries from '../lib/wepublish/countries-de.json';
import { tiptapToText } from '../lib/wepublish/richtext-html';
import {
  fetchChallenge,
  isEmailInUse,
  subscribe,
  SubscribeBlockQuery,
} from '../lib/wepublish/subscribe';
import {
  calculatePeriodAmount,
  findRenderSetting,
  getAmountPickerValues,
  getAvailableGoodies,
  getDefaultPeriodicity,
  getDefaultPlan,
  getPaymentMethods,
  getPeriodicityLabel,
  getPeriodPriceRange,
  getPlanPeriodicities,
  isAmountPickerLayout,
  monthlyAmountFromPeriodAmount,
  resolveAutoRenew,
  shouldHideAmount,
  showsAmountInput,
} from '../lib/wepublish/subscribe-logic';
import {
  formatAmount,
  periodicityName,
  perPeriod,
  TEXTS,
} from '../lib/wepublish/subscribe-texts';
import { CountrySelect } from './country-select';
import { Confirmation, FieldGroup, Submit } from './webform';

const DEFAULT_COUNTRY = 'Schweiz';
// the we.publish login, for e-mail addresses that already have an account
const LOGIN_URL = `${new URL(process.env.NEXT_PUBLIC_ABO_URL || 'https://abos.neuewege.ch').origin}/login`;

// ---- render-array helpers (the data shape of components/webform.js) ----------

const el = (type, name, title, extra = {}) => ({
  '#type': type,
  '#name': name,
  '#id': `edit-${name}`,
  '#title': title,
  ...extra,
});

const fieldset = (id, title, children) => ({
  '#type': 'fieldset',
  '#id': id,
  '#title': title,
  ...children,
});

const twoColumns = children => ({
  '#type': 'container',
  '#attributes': { '#layout': 'two-column' },
  ...children,
});

function radios(name, title, options, value, extra = {}) {
  const children = {};
  for (const [key, label] of options) {
    children[key] = { '#type': 'radio', '#name': name, '#title': label };
  }
  return el('radios', name, title, {
    '#default_value': value,
    ...children,
    ...extra,
  });
}

// ---- price labels ----------------------------------------------------------------

function priceLabel(plan, periodicity, layout) {
  const range = getPeriodPriceRange(plan, periodicity);
  const hidden = shouldHideAmount(layout, range);
  const price = formatAmount(
    hidden ? range.amountTarget || range.amountMin : range.amountMin,
    plan.currency
  );
  const amount = hidden ? price : `ab ${price}`;
  // a plan that is not renewed is paid once (e.g. the Probeabo)
  return plan.extendable ? `${amount} ${perPeriod(periodicity)}` : amount;
}

// "Solidaritätsabo: CHF 150.– pro Jahr, inklusive Mitgliedschaft …" — one
// line of text like the live Drupal options
function planLabel(plan, layout) {
  const description = tiptapToText(plan.shortDescription);
  const label = `${plan.name}: ${priceLabel(plan, getDefaultPeriodicity(plan), layout)}`;
  return description ? `${label}, ${description}` : label;
}

// "Gartenhofstrasse 7a" → street "Gartenhofstrasse", number "7a"; without a
// trailing number the whole line is the street
function splitStreet(line = '') {
  const match = line
    .trim()
    .match(/^(.*\S)\s+(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+\s*[a-zA-Z]?)?)$/);
  return match ?
      {
        streetAddress: match[1],
        streetAddressNumber: match[2].replace(/\s+/g, ''),
      }
    : { streetAddress: line.trim(), streetAddressNumber: '' };
}

const parseFrancs = input => {
  const value = Number(
    String(input || '')
      .replace(',', '.')
      .replace(/[^\d.]/g, '')
  );
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
};

// ---- amount slider ----------------------------------------------------------------

// The free amount (payment-amount-slider.tsx): CHF steps between the plan's
// period minimum and maximum, laid out like a webform fieldset
// (webform.js `FieldsetBlock`); styles/subscribe-form.css draws the range input.
function AmountSlider({ min, max, value, label, onChange, children }) {
  return (
    <div>
      <div>
        <h3>{TEXTS.amount}</h3>
        <fieldset className="edit-amount-group">
          <label className="amount-slider">
            <span className="amount-slider__value">{label}</span>
            <input
              type="range"
              name="amountSlider"
              min={min}
              max={max}
              step={100}
              value={Math.min(max, Math.max(min, value))}
              aria-valuetext={label}
              onChange={event => onChange(Number(event.target.value))}
            />
          </label>
          {children}
        </fieldset>
      </div>
      <br />
      <br />
    </div>
  );
}

// ---- captcha ----------------------------------------------------------------------

// Cloudflare Turnstile / hCaptcha, the two challenge providers of we.publish
// (libs/authentication/website/src/lib/challenge/challenge.tsx); for both the
// challengeID is the site key
const CAPTCHA = {
  CfTurnstile: {
    src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    global: 'turnstile',
  },
  HCaptcha: {
    src: 'https://js.hcaptcha.com/1/api.js?render=explicit&hl=de',
    global: 'hcaptcha',
  },
};

function loadScript(src) {
  window.__nwScripts = window.__nwScripts || {};
  if (!window.__nwScripts[src]) {
    window.__nwScripts[src] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return window.__nwScripts[src];
}

function Captcha({ onChange, captchaRef, onUnavailable }) {
  const node = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    let widget = null;
    let api = null;

    (async () => {
      const challenge = await fetchChallenge();
      const provider = CAPTCHA[challenge?.type];
      if (!provider || !challenge.challengeID)
        throw new Error(`no captcha for ${challenge?.type}`);
      await loadScript(provider.src);
      if (cancelled) return;

      api = window[provider.global];
      widget = api.render(node.current, {
        sitekey: challenge.challengeID,
        language: 'de',
        theme: 'light',
        callback: token =>
          onChange({
            challengeID: challenge.challengeID,
            challengeSolution: token,
          }),
        'expired-callback': () => onChange(null),
      });
      captchaRef.current = {
        reset: () => {
          onChange(null);
          api.reset(widget);
        },
      };
    })().catch(error => {
      console.warn('captcha', error);
      if (!cancelled) onUnavailable();
    });

    return () => {
      cancelled = true;
      if (api && widget != null) api.remove?.(widget);
    };
    // the widget is rendered once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div>
        <h3>{TEXTS.spamProtection}</h3>
        <div ref={node} />
      </div>
      <br />
      <br />
    </div>
  );
}

// ---- the form -----------------------------------------------------------------------

// `subscribeRef`: the paragraph's webform id (resolvers.js `SUBSCRIBE_REF`)
export function SubscribeForm({ subscribeRef }) {
  const { loading, data } = useQuery(SubscribeBlockQuery, {
    variables: { ref: subscribeRef },
  });
  const config = data?.subscribeBlock?.config;

  if (loading) {
    return <div>Wird geladen...</div>;
  }

  // the key restarts the form (and its captcha) if the configuration changes
  return config ?
      <SubscribeBlockForm
        key={subscribeRef}
        block={config}
      />
    : null;
}

function SubscribeBlockForm({ block }) {
  const router = useRouter();
  const plans = block.memberPlans || [];
  const fields = new Set(block.fields || []);
  const defaultPlan = getDefaultPlan(plans, block.memberPlanRenderSettings);

  const [values, setValues] = React.useState(() => ({
    memberPlanId: defaultPlan?.id,
    country: DEFAULT_COUNTRY,
    autoRenew: true,
  }));
  const [challengeAnswer, setChallengeAnswer] = React.useState(null);
  const [captchaUnavailable, setCaptchaUnavailable] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [done, setDone] = React.useState(false);
  const captchaRef = React.useRef(null);

  // the components report their initial `#value` on mount; only real input counts
  const setValue = React.useCallback((name, value) => {
    if (value === undefined) return;
    setValues(state => {
      if (name === 'memberPlanId' && state.memberPlanId !== value) {
        // a new plan starts from its own defaults (subscribe.tsx effects)
        const {
          paymentPeriodicity,
          paymentMethodId,
          amountChoice,
          amountInput,
          amountSlider,
          goodieId,
          ...rest
        } = state;
        return { ...rest, memberPlanId: value };
      }
      return { ...state, [name]: value };
    });
  }, []);

  if (block.disabled || !defaultPlan) return null;
  if (done) return <Confirmation data={{ webform_id: 'abo' }} />;

  const plan = plans.find(p => p.id === values.memberPlanId) ?? defaultPlan;
  const periodicities = getPlanPeriodicities(plan);
  const periodicity =
    periodicities.includes(values.paymentPeriodicity) ?
      values.paymentPeriodicity
    : getDefaultPeriodicity(plan);

  const range = getPeriodPriceRange(plan, periodicity);
  const layout = findRenderSetting(
    block.memberPlanRenderSettings,
    plan.id
  )?.layout;
  const hideAmount = shouldHideAmount(layout, range);
  const pickerValues =
    isAmountPickerLayout(layout) ? getAmountPickerValues(layout) || [] : [];
  // a free amount is chosen on a slider (preset values: radios); an extra
  // text input only where the block asks for one
  const sliderMode = !hideAmount && !isAmountPickerLayout(layout);
  const showInput = !hideAmount && showsAmountInput(layout);
  const defaultAmount = range.amountTarget || range.amountMin;
  // payment-amount-slider.tsx: without a maximum the slider ends at 5× the minimum
  const sliderMax = range.amountMax ?? range.amountMin * 5;
  const sliderAmount = Math.min(
    sliderMax,
    Math.max(range.amountMin, values.amountSlider ?? defaultAmount)
  );
  const typedAmount = showInput ? parseFrancs(values.amountInput) : null;
  const pickedAmount =
    values.amountChoice ?
      calculatePeriodAmount(Number(values.amountChoice), periodicity)
    : null;
  const periodAmount =
    hideAmount ? defaultAmount : (
      (typedAmount ??
      pickedAmount ??
      (sliderMode ? sliderAmount : defaultAmount))
    );

  const methods = getPaymentMethods(plan, periodicity);
  const method =
    methods.find(m => m.id === values.paymentMethodId) ?? methods[0];
  const autoRenew = resolveAutoRenew(
    plan,
    method,
    values.autoRenew !== 0 && values.autoRenew !== false
  );
  const goodies =
    block.showGoodies ?
      getAvailableGoodies(plan, block.goodieMinValue, periodAmount)
    : [];
  const goodieId =
    goodies.some(g => g.id === values.goodieId) ? values.goodieId : null;

  // ---- the render array, section by section (subscribe.tsx order) ----

  const form = {};

  form.plans = fieldset('edit-plans-group', TEXTS.plans, {
    memberPlanId: radios(
      'memberPlanId',
      TEXTS.plans,
      plans.map(p => [
        p.id,
        planLabel(
          p,
          findRenderSetting(block.memberPlanRenderSettings, p.id)?.layout
        ),
      ]),
      plan.id
    ),
  });

  if (periodicities.length > 1) {
    const options = periodicities.map(p => [
      p,
      `${getPeriodicityLabel(plan, p) || periodicityName(p)}: ${priceLabel(plan, p, layout)}`,
    ]);
    // keyed by plan: the components keep their own state
    form[`periodicity-${plan.id}`] = fieldset(
      'edit-periodicity-group',
      TEXTS.periodicity,
      {
        paymentPeriodicity:
          block.periodicityDisplay === 'OfferCards' ?
            radios(
              'paymentPeriodicity',
              TEXTS.periodicity,
              options,
              periodicity
            )
          : el('select', 'paymentPeriodicity', TEXTS.periodicity, {
              '#options': Object.fromEntries(options),
              '#default_value': periodicity,
              '#required': true,
            }),
      }
    );
  }

  const amountInput = showInput && {
    amountInput: el(
      'textfield',
      'amountInput',
      `${TEXTS.amountInput} ${plan.currency}`
    ),
  };

  if (!hideAmount && !sliderMode) {
    form[`amount-${plan.id}-${periodicity}`] = fieldset(
      'edit-amount-group',
      TEXTS.amount,
      {
        amountChoice: radios(
          'amountChoice',
          TEXTS.amount,
          pickerValues.map(v => [
            String(v),
            formatAmount(calculatePeriodAmount(v, periodicity), plan.currency),
          ]),
          values.amountChoice
        ),
        ...amountInput,
      }
    );
  }

  // the slider is no Drupal element, so it sits between two render arrays
  const amountSlider = sliderMode && (
    <AmountSlider
      key={`amount-${plan.id}-${periodicity}`}
      min={range.amountMin}
      max={sliderMax}
      value={typedAmount ?? sliderAmount}
      label={`${formatAmount(typedAmount ?? sliderAmount, plan.currency)} ${plan.extendable ? perPeriod(periodicity) : ''}`.trim()}
      onChange={amount => setValue('amountSlider', amount)}
    >
      {amountInput && (
        <FieldGroup
          passValuesToParent={setValue}
          data={amountInput}
        />
      )}
    </AmountSlider>
  );

  const rest = {};
  const personal = {};
  personal.name = twoColumns({
    name: el('textfield', 'name', TEXTS.name, { '#required': true }),
    ...(fields.has('FirstName') && {
      firstName: el('textfield', 'firstName', TEXTS.firstName, {
        '#required': true,
      }),
    }),
  });
  // one address line like the live form; the house number is split off
  // for we.publish (splitStreet)
  if (fields.has('Address')) {
    personal.street = el('textfield', 'street', TEXTS.street, {
      '#required': true,
    });
    personal.zipCode = el('textfield', 'zipCode', TEXTS.zipCode, {
      '#required': true,
    });
    personal.city = el('textfield', 'city', TEXTS.city, { '#required': true });
    personal.country = el('component', 'country', TEXTS.country, {
      '#component': CountrySelect,
      '#options': Object.fromEntries(countries.map(c => [c, c])),
      '#default_value': values.country,
      '#required': true,
    });
  }
  personal.email = el('email', 'email', TEXTS.email, { '#required': true });
  if (fields.has('EmailRepeated')) {
    personal.emailRepeated = el('email', 'emailRepeated', TEXTS.emailRepeated, {
      '#required': true,
    });
  }
  if (fields.has('Birthday')) {
    personal.birthday = el('date', 'birthday', TEXTS.birthday, {
      '#required': true,
    });
  }
  if (fields.has('Password')) {
    const password = el('password', 'password', TEXTS.password, {
      '#required': true,
    });
    // side by side only with its repetition
    personal.password =
      fields.has('PasswordRepeated') ?
        twoColumns({
          password,
          passwordRepeated: el(
            'password',
            'passwordRepeated',
            TEXTS.passwordRepeated,
            { '#required': true }
          ),
        })
      : password;
  }
  rest.personal = fieldset('edit-personal-group', TEXTS.personal, personal);

  const showAutoRenew = plan.extendable && !method?.forceAutoRenewal;
  if (methods.length > 1 || showAutoRenew) {
    rest[`payment-${plan.id}-${periodicity}`] = fieldset(
      'edit-payment-group',
      methods.length > 1 ? TEXTS.payment : TEXTS.renewal,
      {
        ...(methods.length > 1 && {
          paymentMethodId: radios(
            'paymentMethodId',
            TEXTS.payment,
            methods.map(m => [m.id, m.name]),
            method?.id
          ),
        }),
        ...(showAutoRenew && {
          autoRenew: el('checkbox', 'autoRenew', TEXTS.autoRenew, {
            '#default_value': autoRenew,
          }),
        }),
      }
    );
  }

  if (goodies.length) {
    rest[`goodie-${plan.id}-${goodies.length}`] = fieldset(
      'edit-goodie-group',
      TEXTS.goodie,
      {
        goodieId: radios(
          'goodieId',
          TEXTS.goodie,
          [['', TEXTS.goodieNone], ...goodies.map(g => [g.id, g.name])],
          goodieId ?? ''
        ),
      }
    );
  }

  if (block.showDiscountCodes) {
    rest.discount = fieldset('edit-discount-group', TEXTS.discountCode, {
      discountCode: el('textfield', 'discountCode', TEXTS.discountCode),
    });
  }

  // ---- submit ----

  function validate() {
    if (fields.has('EmailRepeated') && values.email !== values.emailRepeated)
      return TEXTS.emailsDoNotMatch;
    if (fields.has('Password')) {
      if ((values.password || '').length < 12) return TEXTS.passwordTooShort;
      if (
        fields.has('PasswordRepeated') &&
        values.password !== values.passwordRepeated
      )
        return TEXTS.passwordsDoNotMatch;
    }
    if (!hideAmount) {
      if (periodAmount < range.amountMin)
        return TEXTS.amountTooLow(formatAmount(range.amountMin, plan.currency));
      if (range.amountMax != null && periodAmount > range.amountMax) {
        return TEXTS.amountTooHigh(
          formatAmount(range.amountMax, plan.currency)
        );
      }
    }
    if (captchaUnavailable) return TEXTS.captchaUnavailable;
    if (!challengeAnswer) return TEXTS.captchaMissing;
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const invalid = validate();
    setError(invalid ? { text: invalid } : null);
    if (invalid) return;

    setPending(true);
    try {
      const result = await subscribe({
        plan,
        register: {
          name: values.name,
          firstName: fields.has('FirstName') ? values.firstName : null,
          email: values.email,
          password: fields.has('Password') ? values.password : null,
          birthday:
            fields.has('Birthday') && values.birthday ?
              new Date(values.birthday).toISOString()
            : null,
          address:
            fields.has('Address') ?
              {
                ...splitStreet(values.street),
                zipCode: values.zipCode,
                city: values.city,
                country: values.country,
              }
            : null,
          challengeAnswer,
        },
        subscription: {
          memberPlanId: plan.id,
          paymentMethodId: method?.id,
          paymentPeriodicity: periodicity,
          monthlyAmount: monthlyAmountFromPeriodAmount(
            periodAmount,
            periodicity
          ),
          autoRenew,
          goodieId: goodieId || null,
          discountCode:
            block.showDiscountCodes && values.discountCode ?
              values.discountCode
            : null,
        },
      });

      if (result.type === 'redirect') {
        window.location.href = result.url;
      } else if (result.url) {
        router.push(new URL(result.url).pathname);
      } else {
        setDone(true);
      }
    } catch (err) {
      console.warn('subscribe', err);
      setError(
        isEmailInUse(err) ?
          { text: TEXTS.emailInUse, login: true }
        : { text: TEXTS.generic }
      );
      captchaRef.current?.reset();
      setPending(false);
    }
  }

  return (
    <form
      className={`${S.webform.root} subscribe-form`}
      onSubmit={handleSubmit}
    >
      <FieldGroup
        passValuesToParent={setValue}
        data={form}
      />
      {amountSlider}
      <FieldGroup
        passValuesToParent={setValue}
        data={rest}
      />
      <Captcha
        captchaRef={captchaRef}
        onChange={setChallengeAnswer}
        onUnavailable={() => setCaptchaUnavailable(true)}
      />
      {error && (
        <p
          className="subscribe-error"
          role="alert"
          style={{ color: 'red' }}
        >
          {error.text}
          {error.login && (
            <>
              {' '}
              <a href={LOGIN_URL}>{TEXTS.login}</a>
            </>
          )}
        </p>
      )}
      <Submit pending={pending} />
    </form>
  );
}
