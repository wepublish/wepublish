import { GateMode, LoginStatus } from '@prisma/client';
import {
  GateNewsletterParam,
  GateWithActions,
  primaryAction,
} from '@wepublish/gate/api';
import { ContentGate, ContentGateAudience } from './content-gate.model';

export const toContentGate = (
  gate: GateWithActions | null | undefined
): ContentGate | null => {
  if (gate?.mode !== GateMode.CONTENT_GATE) {
    return null;
  }

  const cta = primaryAction(gate);

  return {
    id: gate.id,
    createdAt: gate.createdAt,
    modifiedAt: gate.modifiedAt,
    name: gate.name ?? '',
    active: gate.active,
    audience:
      gate.audience === LoginStatus.LOGGED_OUT ?
        ContentGateAudience.ANONYMOUS
      : ContentGateAudience.NON_SUBSCRIBERS,
    freeArticles: gate.freeArticles ?? 0,
    softGateArticles: gate.softGateArticles ?? 0,
    previewBlocks: gate.previewBlocks ?? 0,
    meterWindowDays: gate.meterWindowDays,
    softDescription: gate.softDescription as ContentGate['softDescription'],
    hardDescription: gate.description as ContentGate['hardDescription'],
    ctaLabel: cta?.label,
    ctaUrl: cta?.url,
    newsletterParams:
      (gate.newsletterParams as unknown as GateNewsletterParam[] | null) ?? [],
    newsletterNeverGate: gate.newsletterNeverGate,
    newsletterFreeArticles: gate.newsletterFreeArticles,
  };
};
