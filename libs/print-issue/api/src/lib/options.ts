import { BadRequestException } from '@nestjs/common';

/**
 * What a list is computed from. A new issue starts from the medium's defaults
 * (setting `printExportDefaults`); every delivery keeps the copy it was
 * computed with.
 */
export type PrintExportOptions = {
  /** only these member plans; null = every subscription plan */
  memberPlanIds: string[] | null;
  /** read bexio (institutions, gifts, bookshops, single issues) when a provider is configured */
  includeBexio: boolean;
  /** only these of the medium's bexio kinds (setting `printBexioKinds`); null = every one */
  bexioKindIds: string[] | null;
  /** renewing readers whose invoice is not paid yet stay in («offen») */
  includeOpen: boolean;
  /** subscriptions starting after the ship day get a copy as a gift («Vorab-Exemplar») */
  includeUpcoming: boolean;
};

export const DEFAULT_OPTIONS: PrintExportOptions = {
  memberPlanIds: null,
  includeBexio: true,
  bexioKindIds: null,
  includeOpen: true,
  includeUpcoming: false,
};

export const PRINT_EXPORT_DEFAULTS_SETTING = 'printExportDefaults';

const FLAGS = ['includeBexio', 'includeOpen', 'includeUpcoming'] as const;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(entry => typeof entry === 'string');

/**
 * The options as stored: what `patch` leaves out comes from `base`. Refuses
 * anything that is not the documented shape; an empty plan list means every
 * plan, like null.
 */
export function optionsFrom(
  patch: unknown,
  base: PrintExportOptions = DEFAULT_OPTIONS
): PrintExportOptions {
  const given = (
    typeof patch === 'object' && patch !== null ?
      patch
    : {}) as Record<string, unknown>;
  const pick = (key: keyof PrintExportOptions): unknown =>
    given[key] === undefined ? base[key] : given[key];
  const plans = pick('memberPlanIds');
  const memberPlanIds: string[] | null | undefined =
    plans === null ? null
    : isStringArray(plans) ? plans
    : undefined;

  if (memberPlanIds === undefined) {
    throw new BadRequestException(
      'memberPlanIds must be a list of member plan ids, or null for every plan.'
    );
  }

  const flags = Object.fromEntries(
    FLAGS.map(key => {
      const value = given[key] ?? base[key];

      if (typeof value !== 'boolean') {
        throw new BadRequestException(`${key} must be true or false.`);
      }

      return [key, value];
    })
  ) as Record<(typeof FLAGS)[number], boolean>;

  // stored before the kinds existed: every kind, as the options read then
  const rawKinds = pick('bexioKindIds') ?? null;
  const kinds: string[] | null | undefined =
    rawKinds === null ? null
    : isStringArray(rawKinds) ? rawKinds
    : undefined;

  if (kinds === undefined) {
    throw new BadRequestException(
      'bexioKindIds must be a list of bexio kind ids, or null for every kind.'
    );
  }

  return {
    memberPlanIds: memberPlanIds?.length ? [...new Set(memberPlanIds)] : null,
    ...flags,
    bexioKindIds: kinds?.length ? [...new Set(kinds)] : null,
  };
}

export const sameOptions = (
  a: PrintExportOptions,
  b: PrintExportOptions
): boolean =>
  FLAGS.every(key => a[key] === b[key]) &&
  sameList(a.memberPlanIds, b.memberPlanIds) &&
  sameList(a.bexioKindIds, b.bexioKindIds);

const sameList = (a: string[] | null, b: string[] | null) =>
  (a === null) === (b === null) &&
  [...(a ?? [])].sort().join('\n') === [...(b ?? [])].sort().join('\n');
