import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';

export type RequestWithResponse = NodeRequest & { res?: NodeResponse };

export const responseBackReference = (
  req: NodeRequest,
  res: NodeResponse,
  next: (err?: unknown) => void
) => {
  (req as RequestWithResponse).res = res;
  next();
};
