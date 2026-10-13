import { GateAction, GateActionRole } from '@prisma/client';

export const primaryAction = (gate: { actions?: GateAction[] | null }) =>
  gate.actions?.find(({ role }) => role === GateActionRole.PRIMARY);
