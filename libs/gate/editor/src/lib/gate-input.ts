import {
  ContentGateNewsletterParamInput,
  FullGateFragment,
  FullImageFragment,
  GateActionInput,
  GateActionRole,
  LoginStatus,
  UpdateGateInput,
} from '@wepublish/editor/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';

/**
 * Paywalls, content gates and banners are all gates, but each keeps the form
 * it had. These map between a form and the gate API.
 */

type RichText = RichtextJSONDocument | null | undefined;

/** What CreateGate and UpdateGate accept besides mode and id. */
export type GateInput = Omit<UpdateGateInput, 'id'>;

const toActionInput = ({
  label,
  url,
  style,
  role,
}: GateActionInput): GateActionInput => ({
  label,
  url,
  style: style ?? '',
  role: role ?? GateActionRole.Other,
});

const primaryActionOf = (gate: FullGateFragment) =>
  gate.actions.find(({ role }) => role === GateActionRole.Primary);

const primaryActions = (url: string | null | undefined, label = '') =>
  url ? [toActionInput({ label, url, role: GateActionRole.Primary })] : [];

export type PaywallFormValues = {
  name?: string | null;
  description?: RichText;
  circumventDescription?: RichText;
  upgradeDescription?: RichText;
  upgradeCircumventDescription?: RichText;
  active: boolean;
  anyMemberPlan: boolean;
  memberPlanIds: string[];
  memberPlans?: Array<{ id: string; name: string }>;
  bypasses: Array<{ id?: string; token: string }>;
  alternativeSubscribeUrl?: string | null;
  fadeout: boolean;
  hideContentAfter: number;
};

export const toPaywallGateInput = ({
  name,
  description,
  circumventDescription,
  upgradeDescription,
  upgradeCircumventDescription,
  active,
  anyMemberPlan,
  memberPlanIds,
  bypasses,
  alternativeSubscribeUrl,
  fadeout,
  hideContentAfter,
}: PaywallFormValues): GateInput => ({
  name,
  description,
  circumventDescription,
  upgradeDescription,
  upgradeCircumventDescription,
  active,
  anyMemberPlan,
  memberPlanIds,
  bypassTokens: bypasses.map(({ token }) => token),
  fadeout,
  previewBlocks: hideContentAfter,
  actions: primaryActions(alternativeSubscribeUrl),
});

export const paywallFromGate = (gate: FullGateFragment): PaywallFormValues => ({
  name: gate.name,
  description: gate.description,
  circumventDescription: gate.circumventDescription,
  upgradeDescription: gate.upgradeDescription,
  upgradeCircumventDescription: gate.upgradeCircumventDescription,
  active: gate.active,
  anyMemberPlan: gate.anyMemberPlan,
  memberPlanIds: gate.memberPlans.map(({ id }) => id),
  memberPlans: gate.memberPlans,
  bypasses: gate.bypasses.map(({ id, token }) => ({ id, token })),
  alternativeSubscribeUrl: primaryActionOf(gate)?.url,
  fadeout: gate.fadeout,
  hideContentAfter: gate.previewBlocks ?? 0,
});

export type BannerFormValues = {
  title: string;
  text: string;
  cta?: string | null;
  html?: string | null;
  embedUrl?: string | null;
  active: boolean;
  collapsible: boolean;
  delay: number;
  hideForMinutes: number;
  showOnArticles: boolean;
  showForLoginStatus: LoginStatus;
  imageId?: string | null;
  image?: FullImageFragment | null;
  showOnPages: Array<{ id: string }>;
  actions: GateActionInput[];
};

export const toBannerGateInput = ({
  title,
  text,
  cta,
  html,
  embedUrl,
  active,
  collapsible,
  delay,
  hideForMinutes,
  showOnArticles,
  showForLoginStatus,
  imageId,
  showOnPages,
  actions,
}: BannerFormValues): GateInput => ({
  title,
  text,
  cta,
  html,
  embedUrl,
  active,
  collapsible,
  delay,
  hideForMinutes,
  showOnArticles,
  audience: showForLoginStatus,
  imageId: imageId ?? null,
  showOnPageIds: showOnPages.map(({ id }) => id),
  actions: actions.map(toActionInput),
});

export const bannerFromGate = (gate: FullGateFragment): BannerFormValues => ({
  title: gate.title ?? '',
  text: gate.text ?? '',
  cta: gate.cta,
  html: gate.html,
  embedUrl: gate.embedUrl,
  active: gate.active,
  collapsible: gate.collapsible,
  delay: gate.delay,
  hideForMinutes: gate.hideForMinutes,
  showOnArticles: gate.showOnArticles,
  showForLoginStatus: gate.audience,
  imageId: gate.image?.id,
  image: gate.image,
  showOnPages: gate.showOnPages.map(({ id }) => ({ id })),
  actions: gate.actions,
});

export type ContentGateFormValues = {
  name: string;
  active: boolean;
  audience: LoginStatus;
  freeArticles: number;
  softGateArticles: number;
  previewBlocks: number;
  meterWindowDays?: number | null;
  softDescription?: RichText;
  hardDescription?: RichText;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  newsletterParams: ContentGateNewsletterParamInput[];
  newsletterNeverGate: boolean;
  newsletterFreeArticles: number;
};

export const toContentGateGateInput = ({
  name,
  active,
  audience,
  freeArticles,
  softGateArticles,
  previewBlocks,
  meterWindowDays,
  softDescription,
  hardDescription,
  ctaLabel,
  ctaUrl,
  newsletterParams,
  newsletterNeverGate,
  newsletterFreeArticles,
}: ContentGateFormValues): GateInput => ({
  name,
  active,
  audience,
  freeArticles,
  softGateArticles,
  previewBlocks,
  meterWindowDays,
  softDescription,
  description: hardDescription,
  newsletterParams: newsletterParams
    .filter(({ key }) => key.trim())
    .map(({ key, value }) => ({ key, value })),
  newsletterNeverGate,
  newsletterFreeArticles,
  actions: primaryActions(ctaUrl, ctaLabel ?? ''),
});

export const contentGateFromGate = (
  gate: FullGateFragment
): ContentGateFormValues => {
  const cta = primaryActionOf(gate);

  return {
    name: gate.name ?? '',
    active: gate.active,
    audience: gate.audience,
    freeArticles: gate.freeArticles ?? 0,
    softGateArticles: gate.softGateArticles ?? 0,
    previewBlocks: gate.previewBlocks ?? 0,
    meterWindowDays: gate.meterWindowDays,
    softDescription: gate.softDescription,
    hardDescription: gate.description,
    ctaLabel: cta?.label || null,
    ctaUrl: cta?.url ?? null,
    newsletterParams: gate.newsletterParams.map(({ key, value }) => ({
      key,
      value,
    })),
    newsletterNeverGate: gate.newsletterNeverGate,
    newsletterFreeArticles: gate.newsletterFreeArticles,
  };
};
