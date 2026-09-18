import {
  BlockContentInput,
  Currency,
  getApiClientV2,
  MemberPlanListDocument,
  PageListDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
  ProductType,
  SubscribeBlockField,
  SubscribeBlockInput,
  SubscribeBlockRenderLayout,
  SubscribePeriodicityDisplay,
  useCreateMemberPlanMutation,
  useCreatePageMutation,
  useCreatePaymentMethodMutation,
  useDeleteMemberPlanMutation,
  useDeletePageMutation,
  useDeletePaymentMethodMutation,
  usePublishPageMutation,
} from '@wepublish/editor/api';
import { RichtextJSONDocument } from '@wepublish/richtext';
import { useState } from 'react';

const SLUG_PREFIX = 't-';
const INDEX_SLUG = 't-index';

const paragraph = (text: string): RichtextJSONDocument =>
  ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  }) as RichtextJSONDocument;

const linkList = (
  items: Array<{ slug: string; label: string }>
): RichtextJSONDocument =>
  ({
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: items.map(({ slug, label }) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: label,
                  marks: [{ type: 'link', attrs: { href: `/${slug}` } }],
                },
              ],
            },
          ],
        })),
      },
    ],
  }) as RichtextJSONDocument;

type PriceRow = {
  periodicity: PaymentPeriodicity;
  amountMin?: number | null;
  amountTarget?: number | null;
  amountMax?: number | null;
  label?: string | null;
};

type PlanSpec = {
  key: string;
  core?: boolean;
  name: string;
  productType?: ProductType;
  currency?: Currency;
  extendable?: boolean;
  active?: boolean;
  defaultPaymentPeriodicity?: PaymentPeriodicity;
  periodicities: PaymentPeriodicity[];
  prices: PriceRow[];
};

const { Monthly, Quarterly, Yearly, Biennial, Lifetime } = PaymentPeriodicity;

const LONG_LABEL =
  '2 Monate geschenkt im Vergleich zur monatlichen Zahlung, ausserdem erhältst du unser Jahresmagazin gratis nach Hause geliefert und wirst zu allen Mitglieder-Anlässen eingeladen.';

const PLAN_SPECS: PlanSpec[] = [
  {
    key: 'monthly-floor',
    core: true,
    name: 'Monatlicher Mindestbetrag',
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 500 }],
  },
  {
    key: 'monthly-exact',
    core: true,
    name: 'Fixer Monatspreis',
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 1000, amountMax: 1000 }],
  },
  {
    key: 'per-interval',
    core: true,
    name: 'Eigene Intervallpreise',
    periodicities: [Monthly, Yearly],
    prices: [
      { periodicity: Monthly, amountMin: 1000 },
      { periodicity: Yearly, amountMin: 10000, label: '2 Monate geschenkt' },
    ],
  },
  {
    key: 'yearly-only-offered',
    core: true,
    name: 'Nur jährlich buchbar',
    periodicities: [Yearly],
    prices: [{ periodicity: Monthly, amountMin: 1000 }],
  },
  {
    key: 'free',
    core: true,
    name: 'Gratis-Mitgliedschaft',
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 0 }],
  },
  {
    key: 'three-intervals',
    core: true,
    name: 'Drei Intervalle',
    periodicities: [Monthly, Quarterly, Yearly],
    prices: [
      { periodicity: Monthly, amountMin: 1000 },
      { periodicity: Quarterly, amountMin: 2800 },
      { periodicity: Yearly, amountMin: 10000 },
    ],
  },
  {
    key: 'monthly-target',
    name: 'Mit Zielbetrag',
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 500, amountTarget: 1200 }],
  },
  {
    key: 'monthly-range',
    name: 'Mit Min Ziel und Max',
    periodicities: [Monthly, Yearly],
    prices: [
      {
        periodicity: Monthly,
        amountMin: 500,
        amountTarget: 1000,
        amountMax: 5000,
      },
    ],
  },
  {
    key: 'per-interval-labels',
    name: 'Intervalle mit Labels',
    periodicities: [Monthly, Quarterly, Yearly],
    prices: [
      { periodicity: Monthly, amountMin: 1000 },
      { periodicity: Quarterly, amountMin: 2700, label: 'Beliebteste Wahl' },
      { periodicity: Yearly, amountMin: 10000, label: LONG_LABEL },
    ],
  },
  {
    key: 'yearly-only-priced',
    name: 'Nur Jahrespreis gesetzt',
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Yearly, amountMin: 12000 }],
  },
  {
    key: 'lifetime',
    name: 'Lebenslang',
    periodicities: [Lifetime],
    prices: [{ periodicity: Lifetime, amountMin: 50000 }],
  },
  {
    key: 'donation',
    name: 'Spende',
    productType: ProductType.Donation,
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 0 }],
  },
  {
    key: 'eur',
    name: 'Euro-Abo',
    currency: Currency.Eur,
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 900 }],
  },
  {
    key: 'non-extendable',
    name: 'Nicht verlängerbar',
    extendable: false,
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 1000 }],
  },
  {
    key: 'default-yearly',
    name: 'Standard jährlich',
    defaultPaymentPeriodicity: Yearly,
    periodicities: [Monthly, Yearly],
    prices: [
      { periodicity: Monthly, amountMin: 1000 },
      { periodicity: Yearly, amountMin: 10000 },
    ],
  },
  {
    key: 'biennial',
    name: 'Zweijährlich',
    periodicities: [Monthly, Biennial],
    prices: [
      { periodicity: Monthly, amountMin: 1000 },
      { periodicity: Biennial, amountMin: 20000 },
    ],
  },
  {
    key: 'long-name',
    name: 'Mitgliedschaft mit einem aussergewöhnlich langen Namen für Layouttests',
    periodicities: [Monthly, Yearly],
    prices: [
      { periodicity: Monthly, amountMin: 1000 },
      { periodicity: Yearly, amountMin: 10000, label: LONG_LABEL },
    ],
  },
  {
    key: 'no-methods',
    name: 'Ohne Zahlungsmethode',
    periodicities: [],
    prices: [{ periodicity: Monthly, amountMin: 1000 }],
  },
  {
    key: 'high-min',
    name: 'Hoher Mindestbetrag',
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 5000 }],
  },
  {
    key: 'inactive',
    name: 'Inaktiver Plan',
    active: false,
    periodicities: [Monthly, Yearly],
    prices: [{ periodicity: Monthly, amountMin: 1000 }],
  },
];

type LayoutSpec = {
  key: string;
  build: () => SubscribeBlockInput['memberPlanRenderSettings'][number]['layout'];
};

const LAYOUT_SPECS: LayoutSpec[] = [
  {
    key: 'none',
    build: () => ({
      type: SubscribeBlockRenderLayout.None,
      showInput: false,
    }),
  },
  {
    key: 'none-input',
    build: () => ({ type: SubscribeBlockRenderLayout.None, showInput: true }),
  },
  {
    key: 'slider',
    build: () => ({
      type: SubscribeBlockRenderLayout.Slider,
      showInput: false,
    }),
  },
  {
    key: 'slider-input',
    build: () => ({ type: SubscribeBlockRenderLayout.Slider, showInput: true }),
  },
  {
    key: 'picker-default',
    build: () => ({
      type: SubscribeBlockRenderLayout.Picker,
      showInput: false,
      values: [],
    }),
  },
  {
    key: 'picker-input',
    build: () => ({
      type: SubscribeBlockRenderLayout.Picker,
      showInput: true,
      values: [],
    }),
  },
  {
    key: 'picker-values',
    build: () => ({
      type: SubscribeBlockRenderLayout.Picker,
      showInput: false,
      values: [1000, 2500, 5000],
    }),
  },
  {
    key: 'picker-periods',
    build: () => ({
      type: SubscribeBlockRenderLayout.Picker,
      showInput: false,
      values: [],
      valuesByPeriodicity: [
        { periodicity: Monthly, values: [1000, 1500, 2000] },
        { periodicity: Quarterly, values: [3000, 4500, 6000] },
        { periodicity: Yearly, values: [12000, 18000, 24000] },
      ],
    }),
  },
];

const DISPLAY_SPECS: Array<{
  key: string;
  display?: SubscribePeriodicityDisplay;
}> = [
  { key: 'dropdown', display: SubscribePeriodicityDisplay.Dropdown },
  { key: 'offercards', display: SubscribePeriodicityDisplay.OfferCards },
  { key: 'toggle', display: SubscribePeriodicityDisplay.Toggle },
];

type PlanIds = Record<string, string>;

type BlockPlan = {
  planKey: string;
  layout: LayoutSpec;
  isDefault?: boolean;
};

type CaseSpec = {
  slug: string;
  title: string;
  group: string;
  display?: SubscribePeriodicityDisplay;
  plans: BlockPlan[];
  allPlans?: boolean;
  showGoodies?: boolean;
  showDiscountCodes?: boolean;
  goodieMinValue?: number;
  fields?: SubscribeBlockField[];
  extraSettingPlanKey?: string;
};

const layoutByKey = (key: string) =>
  LAYOUT_SPECS.find(layout => layout.key === key) as LayoutSpec;

const buildCases = (): CaseSpec[] => {
  const cases: CaseSpec[] = [];
  const corePlans = PLAN_SPECS.filter(plan => plan.core);

  // Group A — the cube: display × layout × core archetype
  for (const display of DISPLAY_SPECS) {
    for (const layout of LAYOUT_SPECS) {
      for (const plan of corePlans) {
        cases.push({
          slug: `${SLUG_PREFIX}cube-${display.key}-${layout.key}-${plan.key}`,
          title: `Cube · ${display.key} · ${layout.key} · ${plan.key}`,
          group: 'A cube',
          display: display.display,
          plans: [{ planKey: plan.key, layout, isDefault: true }],
        });
      }
    }
  }

  // Group B — every pricing archetype against each display mode
  for (const plan of PLAN_SPECS) {
    for (const display of DISPLAY_SPECS) {
      cases.push({
        slug: `${SLUG_PREFIX}plan-${plan.key}-${display.key}`,
        title: `Plan · ${plan.key} · ${display.key}`,
        group: 'B pricing',
        display: display.display,
        plans: [
          {
            planKey: plan.key,
            layout: layoutByKey('picker-input'),
            isDefault: true,
          },
        ],
      });
    }
  }

  // Group C — multiple plans in one block
  const multi: Array<{ name: string; plans: BlockPlan[] }> = [
    {
      name: 'two-same',
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
        { planKey: 'per-interval', layout: layoutByKey('slider') },
      ],
    },
    {
      name: 'two-mixed-layout',
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
        { planKey: 'per-interval', layout: layoutByKey('picker-input') },
      ],
    },
    {
      name: 'two-mixed-currency',
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('picker-default'),
          isDefault: true,
        },
        { planKey: 'eur', layout: layoutByKey('picker-default') },
      ],
    },
    {
      name: 'three-core',
      plans: [
        { planKey: 'monthly-floor', layout: layoutByKey('slider') },
        {
          planKey: 'per-interval',
          layout: layoutByKey('picker-input'),
          isDefault: true,
        },
        { planKey: 'monthly-exact', layout: layoutByKey('none') },
      ],
    },
    {
      name: 'three-mixed-availability',
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
        { planKey: 'yearly-only-offered', layout: layoutByKey('slider') },
        { planKey: 'lifetime', layout: layoutByKey('slider') },
      ],
    },
    {
      name: 'default-not-first',
      plans: [
        { planKey: 'monthly-floor', layout: layoutByKey('slider') },
        { planKey: 'per-interval', layout: layoutByKey('slider') },
        {
          planKey: 'monthly-exact',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
    },
    {
      name: 'in-card-amounts',
      plans: [
        {
          planKey: 'monthly-target',
          layout: layoutByKey('none-input'),
          isDefault: true,
        },
        { planKey: 'monthly-floor', layout: layoutByKey('none-input') },
        { planKey: 'monthly-exact', layout: layoutByKey('none') },
      ],
    },
  ];

  for (const entry of multi) {
    for (const display of DISPLAY_SPECS) {
      cases.push({
        slug: `${SLUG_PREFIX}multi-${entry.name}-${display.key}`,
        title: `Multi · ${entry.name} · ${display.key}`,
        group: 'C multi-plan',
        display: display.display,
        plans: entry.plans,
      });
    }
  }

  cases.push({
    slug: `${SLUG_PREFIX}multi-twenty-plans`,
    title: 'Multi · 20 Pläne',
    group: 'C multi-plan',
    display: SubscribePeriodicityDisplay.Dropdown,
    plans: PLAN_SPECS.filter(plan => plan.active !== false).map(
      (plan, index) => ({
        planKey: plan.key,
        layout: LAYOUT_SPECS[index % LAYOUT_SPECS.length],
        isDefault: index === 0,
      })
    ),
  });

  // Group D — block-level features
  cases.push(
    {
      slug: `${SLUG_PREFIX}block-no-plans-selected`,
      title: 'Block · keine Pläne gewählt',
      group: 'D block',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [],
      allPlans: true,
    },
    {
      slug: `${SLUG_PREFIX}block-goodies`,
      title: 'Block · Goodies',
      group: 'D block',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
      showGoodies: true,
      goodieMinValue: 2000,
    },
    {
      slug: `${SLUG_PREFIX}block-discount-codes`,
      title: 'Block · Rabattcodes',
      group: 'D block',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
      showDiscountCodes: true,
    },
    {
      slug: `${SLUG_PREFIX}block-all-fields`,
      title: 'Block · alle Felder',
      group: 'D block',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
      fields: [
        SubscribeBlockField.FirstName,
        SubscribeBlockField.Birthday,
        SubscribeBlockField.Address,
        SubscribeBlockField.EmailRepeated,
        SubscribeBlockField.Password,
        SubscribeBlockField.PasswordRepeated,
      ],
    },
    {
      slug: `${SLUG_PREFIX}block-no-fields`,
      title: 'Block · keine Felder',
      group: 'D block',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
      fields: [],
    },
    {
      slug: `${SLUG_PREFIX}block-legacy-null-display`,
      title: 'Block · periodicityDisplay nicht gesetzt',
      group: 'D block',
      plans: [
        {
          planKey: 'per-interval',
          layout: layoutByKey('picker-default'),
          isDefault: true,
        },
      ],
    }
  );

  // Group E — hostile but API-valid configurations
  const tilesBelowMin: LayoutSpec = {
    key: 'tiles-below-min',
    build: () => ({
      type: SubscribeBlockRenderLayout.Picker,
      showInput: false,
      values: [100, 200, 300],
    }),
  };
  const tilesSingle: LayoutSpec = {
    key: 'tiles-single',
    build: () => ({
      type: SubscribeBlockRenderLayout.Picker,
      showInput: false,
      values: [2500],
    }),
  };
  const tilesHuge: LayoutSpec = {
    key: 'tiles-huge',
    build: () => ({
      type: SubscribeBlockRenderLayout.Picker,
      showInput: true,
      values: [
        500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000,
        25000,
      ],
    }),
  };

  cases.push(
    {
      slug: `${SLUG_PREFIX}break-tiles-below-min`,
      title: 'Break · Kacheln unter dem Mindestbetrag',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [{ planKey: 'high-min', layout: tilesBelowMin, isDefault: true }],
    },
    {
      slug: `${SLUG_PREFIX}break-tiles-single`,
      title: 'Break · nur eine Kachel',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        { planKey: 'monthly-floor', layout: tilesSingle, isDefault: true },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-tiles-huge`,
      title: 'Break · zwölf Kacheln',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Toggle,
      plans: [{ planKey: 'per-interval', layout: tilesHuge, isDefault: true }],
    },
    {
      slug: `${SLUG_PREFIX}break-min-equals-max-slider`,
      title: 'Break · fixer Preis mit Slider',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'monthly-exact',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-zero-min-picker`,
      title: 'Break · Mindestbetrag 0 mit Kacheln',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'free',
          layout: layoutByKey('picker-input'),
          isDefault: true,
        },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-long-name`,
      title: 'Break · sehr langer Planname',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.OfferCards,
      plans: [
        {
          planKey: 'long-name',
          layout: layoutByKey('picker-input'),
          isDefault: true,
        },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-no-methods`,
      title: 'Break · Plan ohne Zahlungsmethode',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.OfferCards,
      plans: [
        {
          planKey: 'no-methods',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-lifetime-only`,
      title: 'Break · nur lebenslang',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Toggle,
      plans: [
        { planKey: 'lifetime', layout: layoutByKey('slider'), isDefault: true },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-yearly-only-dropdown`,
      title: 'Break · nur jährlich im Auswahlfeld',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'yearly-only-offered',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-all-unavailable`,
      title: 'Break · alle Pläne ohne monatlich',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'yearly-only-offered',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
        { planKey: 'lifetime', layout: layoutByKey('slider') },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-inactive-plan`,
      title: 'Break · inaktiver Plan im Block',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
        { planKey: 'inactive', layout: layoutByKey('slider') },
      ],
    },
    {
      slug: `${SLUG_PREFIX}break-orphan-setting`,
      title: 'Break · Render-Setting ohne Plan im Block',
      group: 'E hostile',
      display: SubscribePeriodicityDisplay.Dropdown,
      plans: [
        {
          planKey: 'monthly-floor',
          layout: layoutByKey('slider'),
          isDefault: true,
        },
      ],
      extraSettingPlanKey: 'per-interval',
    }
  );

  return cases;
};

const buildSubscribeBlock = (
  testCase: CaseSpec,
  planIds: PlanIds
): BlockContentInput => {
  const memberPlanIds =
    testCase.allPlans ?
      []
    : testCase.plans.map(plan => planIds[plan.planKey]).filter(Boolean);

  const memberPlanRenderSettings = testCase.plans
    .filter(plan => !!planIds[plan.planKey])
    .map(plan => ({
      memberPlanId: planIds[plan.planKey],
      isDefault: !!plan.isDefault,
      layout: plan.layout.build(),
    }));

  if (testCase.extraSettingPlanKey && planIds[testCase.extraSettingPlanKey]) {
    memberPlanRenderSettings.push({
      memberPlanId: planIds[testCase.extraSettingPlanKey],
      isDefault: false,
      layout: layoutByKey('picker-input').build(),
    });
  }

  return {
    subscribe: {
      memberPlanIds,
      memberPlanRenderSettings,
      periodicityDisplay: testCase.display,
      fields: testCase.fields ?? [SubscribeBlockField.FirstName],
      showGoodies: testCase.showGoodies ?? false,
      showDiscountCodes: testCase.showDiscountCodes ?? false,
      goodieMinValue: testCase.goodieMinValue ?? null,
      goodieMinValueAppliesToUpgrade: false,
      hideRepeatGoodieOnUpgrade: false,
    } as SubscribeBlockInput,
  } as BlockContentInput;
};

async function seedPaymentMethods(createPaymentMethod: any) {
  const created = await Promise.all(
    [
      { name: 'Seed Payrexx', slug: 'seed-payrexx', provider: 'payrexx' },
      { name: 'Seed Stripe', slug: 'seed-stripe', provider: 'stripe' },
    ].map(method =>
      createPaymentMethod({
        variables: {
          name: method.name,
          slug: method.slug,
          description: '',
          paymentProviderID: method.provider,
          gracePeriod: 7,
          imageId: null,
          active: true,
        },
      })
    )
  );

  return created
    .map(result => result?.data?.createPaymentMethod?.id)
    .filter(Boolean) as string[];
}

async function seedMemberPlans(
  createMemberPlan: any,
  paymentMethodIDs: string[],
  log: (message: string) => void
): Promise<PlanIds> {
  const planIds: PlanIds = {};

  for (const spec of PLAN_SPECS) {
    log(`Plan: ${spec.name}`);

    const result = await createMemberPlan({
      variables: {
        name: spec.name,
        slug: `seed-${spec.key}`,
        active: spec.active ?? true,
        description: null,
        shortDescription: paragraph(
          `Testfall «${spec.key}» – siehe subscribe-test-cases.md.`
        ),
        imageID: null,
        periodicityPricing: spec.prices,
        defaultPaymentPeriodicity: spec.defaultPaymentPeriodicity ?? null,
        productType: spec.productType ?? ProductType.Subscription,
        currency: spec.currency ?? Currency.Chf,
        extendable: spec.extendable ?? true,
        externalReward: null,
        maxCount: null,
        migrateToTargetPaymentMethodID: null,
        tags: ['seed'],
        availablePaymentMethods:
          spec.periodicities.length ?
            [
              {
                forceAutoRenewal: false,
                paymentMethodIDs,
                paymentPeriodicities: spec.periodicities,
              },
            ]
          : [],
        confirmationPageId: null,
        failPageId: null,
        successPageId: null,
      },
    });

    const id = result?.data?.createMemberPlan?.id;

    if (id) {
      planIds[spec.key] = id;
    }
  }

  return planIds;
}

async function seedCasePages(
  createPage: any,
  publishPage: any,
  cases: CaseSpec[],
  planIds: PlanIds,
  log: (message: string) => void
) {
  let done = 0;

  for (const testCase of cases) {
    const created = await createPage({
      variables: {
        slug: testCase.slug,
        title: testCase.title,
        description: null,
        seoTitle: null,
        seoDescription: null,
        socialMediaTitle: null,
        socialMediaDescription: null,
        socialMediaImageID: null,
        imageID: null,
        hidden: false,
        tagIds: [],
        properties: [],
        blocks: [
          {
            richText: { richText: paragraph(testCase.title) },
          } as BlockContentInput,
          buildSubscribeBlock(testCase, planIds),
        ] as BlockContentInput[],
      },
    });

    const id = created?.data?.createPage?.id;

    if (id) {
      await publishPage({
        variables: { id, publishedAt: new Date().toISOString() },
      });
    }

    done += 1;

    if (done % 10 === 0) {
      log(`${done}/${cases.length} Seiten`);
    }
  }
}

async function seedIndexPage(
  createPage: any,
  publishPage: any,
  cases: CaseSpec[]
) {
  const created = await createPage({
    variables: {
      slug: INDEX_SLUG,
      title: 'Subscribe-Testfälle',
      description: null,
      seoTitle: null,
      seoDescription: null,
      socialMediaTitle: null,
      socialMediaDescription: null,
      socialMediaImageID: null,
      imageID: null,
      hidden: false,
      tagIds: [],
      properties: [],
      blocks: [
        {
          richText: {
            richText: linkList(
              cases.map(testCase => ({
                slug: testCase.slug,
                label: `${testCase.group} — ${testCase.title}`,
              }))
            ),
          },
        } as BlockContentInput,
      ] as BlockContentInput[],
    },
  });

  const id = created?.data?.createPage?.id;

  if (id) {
    await publishPage({
      variables: { id, publishedAt: new Date().toISOString() },
    });
  }
}

const PAGE_SIZE = 100;

async function fetchAll(
  client: any,
  query: any,
  pick: (data: any) => { nodes: Array<{ id: string; slug?: string }> } | null,
  extraVariables: Record<string, unknown> = {}
) {
  let skip = 0;
  const all: Array<{ id: string; slug?: string }> = [];
  let hasMore = true;

  while (hasMore) {
    const { data } = await client.query({
      query,
      variables: { take: PAGE_SIZE, skip, ...extraVariables },
      fetchPolicy: 'network-only',
    });

    const result = pick(data);
    const nodes = result?.nodes ?? [];
    all.push(...nodes);

    hasMore = nodes.length === PAGE_SIZE;
    skip += PAGE_SIZE;
  }

  return all;
}

async function deleteSeeded(
  client: any,
  deletePage: any,
  deleteMemberPlan: any,
  deletePaymentMethod: any,
  log: (message: string) => void
) {
  const pages = await fetchAll(client, PageListDocument, data => data?.pages);
  const seededPages = pages.filter(page =>
    (page.slug ?? '').startsWith(SLUG_PREFIX)
  );
  log(`Lösche ${seededPages.length} Seiten`);

  for (const page of seededPages) {
    await deletePage({ variables: { id: page.id } });
  }

  const plans = await fetchAll(
    client,
    MemberPlanListDocument,
    data => data?.memberPlans
  );
  const seededPlans = plans.filter(plan =>
    (plan.slug ?? '').startsWith('seed-')
  );
  log(`Lösche ${seededPlans.length} Abo-Pläne`);

  for (const plan of seededPlans) {
    await deleteMemberPlan({ variables: { id: plan.id } });
  }

  const { data: methodData } = await client.query({
    query: PaymentMethodListDocument,
    variables: { take: PAGE_SIZE, skip: 0 },
    fetchPolicy: 'network-only',
  });
  const seededMethods = (methodData?.paymentMethods ?? []).filter(
    (method: { slug?: string }) => (method.slug ?? '').startsWith('seed-')
  );
  log(`Lösche ${seededMethods.length} Zahlungsmethoden`);

  for (const method of seededMethods) {
    await deletePaymentMethod({ variables: { id: method.id } }).catch(
      () => undefined
    );
  }
}

export const Seed = () => {
  const client = getApiClientV2();
  const [createPaymentMethod] = useCreatePaymentMethodMutation({ client });
  const [createMemberPlan] = useCreateMemberPlanMutation({ client });
  const [createPage] = useCreatePageMutation({ client });
  const [publishPage] = usePublishPageMutation({ client });
  const [deletePage] = useDeletePageMutation({ client });
  const [deleteMemberPlan] = useDeleteMemberPlanMutation({ client });
  const [deletePaymentMethod] = useDeletePaymentMethodMutation({ client });

  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const cases = buildCases();
  const log = (message: string) =>
    setMessages(current => [...current, message]);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setMessages([]);

    try {
      await task();
      log('Fertig.');
    } catch (error) {
      log(`Fehler: ${String(error)}`);
      console.error(error);
    }

    setBusy(false);
  };

  return (
    <div style={{ padding: 20, display: 'grid', gap: 12 }}>
      <h2>{'Subscribe-Testfälle'}</h2>

      <p>
        {`${cases.length} Seiten aus ${PLAN_SPECS.length} Abo-Plänen. Slugs beginnen mit «${SLUG_PREFIX}», Plan-Slugs mit «seed-». Übersicht: /${INDEX_SLUG}`}
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          disabled={busy}
          onClick={() =>
            run(async () => {
              log('Zahlungsmethoden…');
              const paymentMethodIDs =
                await seedPaymentMethods(createPaymentMethod);

              log('Abo-Pläne…');
              const planIds = await seedMemberPlans(
                createMemberPlan,
                paymentMethodIDs,
                log
              );

              log(`Seiten… (${cases.length})`);
              await seedCasePages(createPage, publishPage, cases, planIds, log);
              await seedIndexPage(createPage, publishPage, cases);
            })
          }
        >
          {'Testfälle erstellen'}
        </button>

        <button
          disabled={busy}
          onClick={() =>
            run(() =>
              deleteSeeded(
                client,
                deletePage,
                deleteMemberPlan,
                deletePaymentMethod,
                log
              )
            )
          }
        >
          {'Testfälle löschen'}
        </button>
      </div>

      <pre style={{ maxHeight: 400, overflow: 'auto', fontSize: 12 }}>
        {messages.join('\n')}
      </pre>
    </div>
  );
};
