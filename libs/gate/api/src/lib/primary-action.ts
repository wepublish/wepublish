import { GateAction, GateActionRole } from '@prisma/client';

/**
 * The paywall's subscribe url and the content gate's CTA are the primary
 * action of their gate.
 */
export const primaryAction = (gate: { actions?: GateAction[] | null }) =>
  gate.actions?.find(({ role }) => role === GateActionRole.PRIMARY);
