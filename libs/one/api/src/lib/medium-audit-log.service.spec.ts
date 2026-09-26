import { AuditLogService } from '@wepublish/audit-log/api';
import {
  AUDIT_LOG_LIST_LIMIT,
  MediumAuditLogService,
} from './medium-audit-log.service';

describe('MediumAuditLogService', () => {
  let service: MediumAuditLogService;
  let auditLogService: { getAuditLogsSafe: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogService = { getAuditLogsSafe: jest.fn() };
    service = new MediumAuditLogService(
      auditLogService as unknown as AuditLogService
    );
  });

  it('passes the filter through and reports support', async () => {
    auditLogService.getAuditLogsSafe.mockResolvedValue({
      nodes: [{ id: 'a' }],
      totalCount: 1,
      supported: true,
    });

    const result = await service.listAuditLogs({ sessionID: 'session-1' });

    expect(result).toEqual({
      nodes: [{ id: 'a' }],
      totalCount: 1,
      supported: true,
    });
    expect(auditLogService.getAuditLogsSafe).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { sessionID: 'session-1' } })
    );
  });

  it('caps the limit', async () => {
    auditLogService.getAuditLogsSafe.mockResolvedValue({
      nodes: [],
      totalCount: 0,
      supported: true,
    });

    await service.listAuditLogs(undefined, 10_000);

    expect(auditLogService.getAuditLogsSafe).toHaveBeenCalledWith(
      expect.objectContaining({ take: AUDIT_LOG_LIST_LIMIT })
    );
  });

  it('raises a limit below one', async () => {
    auditLogService.getAuditLogsSafe.mockResolvedValue({
      nodes: [],
      totalCount: 0,
      supported: true,
    });

    await service.listAuditLogs(undefined, 0);

    expect(auditLogService.getAuditLogsSafe).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 })
    );
  });

  it('passes an unsupported audit log through', async () => {
    auditLogService.getAuditLogsSafe.mockResolvedValue({
      nodes: [],
      totalCount: 0,
      supported: false,
    });

    expect(await service.listAuditLogs()).toEqual({
      nodes: [],
      totalCount: 0,
      supported: false,
    });
  });
});
