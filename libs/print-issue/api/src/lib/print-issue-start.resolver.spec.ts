import { Reflector } from '@nestjs/core';
import { PUBLIC_METADATA_KEY } from '@wepublish/authentication/api';
import { PrintIssueStartResolver } from './print-issue-start.resolver';
import type { PrintIssueStartService } from './print-issue-start.service';

describe('PrintIssueStartResolver', () => {
  it('answers the website without a session, also where the print export is off', async () => {
    const start = {
      current: { id: 'i', label: '#117', title: null, issueDate: '2026-11-13' },
      upcoming: null,
    };
    const service = { start: vi.fn(async () => start) };
    const resolver = new PrintIssueStartResolver(
      service as unknown as PrintIssueStartService
    );

    expect(await resolver.printIssueStart()).toBe(start);

    // public: the subscribe form asks before anyone is signed in
    const isPublic = new Reflector().get(
      PUBLIC_METADATA_KEY,
      PrintIssueStartResolver.prototype.printIssueStart
    );
    expect(isPublic).toBe(true);
  });
});
