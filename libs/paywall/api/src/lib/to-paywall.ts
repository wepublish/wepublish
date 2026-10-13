import { GateMode } from '@prisma/client';
import { GateWithActions, primaryAction } from '@wepublish/gate/api';
import { Paywall } from './paywall.model';

type PaywallFields = Omit<Paywall, 'memberPlans' | 'bypasses'>;

export const toPaywall = (
  gate: GateWithActions | null | undefined
): PaywallFields | null => {
  if (gate?.mode !== GateMode.PAYWALL) {
    return null;
  }

  return {
    id: gate.id,
    createdAt: gate.createdAt,
    modifiedAt: gate.modifiedAt,
    name: gate.name ?? undefined,
    active: gate.active,
    anyMemberPlan: gate.anyMemberPlan,
    fadeout: gate.fadeout,
    hideContentAfter: gate.previewBlocks ?? 0,
    description: gate.description as Paywall['description'],
    circumventDescription:
      gate.circumventDescription as Paywall['circumventDescription'],
    upgradeDescription:
      gate.upgradeDescription as Paywall['upgradeDescription'],
    upgradeCircumventDescription:
      gate.upgradeCircumventDescription as Paywall['upgradeCircumventDescription'],
    alternativeSubscribeUrl: primaryAction(gate)?.url,
  };
};
