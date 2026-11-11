import { Test } from '@nestjs/testing';
import {
  EmailQualityEventSource,
  EmailQualityEventType,
  PrismaClient,
} from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { EMAIL_QUALITY_RECORDER } from '@wepublish/mail/api';
import type { Mock } from 'vitest';
import { MailchimpCampaignClicksService } from './mailchimp-campaign-clicks';

vi.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    reports: {
      getAllCampaignReports: vi.fn(),
      getCampaignClickDetails: vi.fn(),
      getSubscribersInfo: vi.fn(),
    },
  },
}));

const reports = (mailchimp as unknown as { reports: Record<string, Mock> })
  .reports;

const LIST_ID = 'list-1';
const SENT = '2026-10-20T06:00:00+00:00';

const report = (overrides: Record<string, unknown> = {}) => ({
  id: 'camp-1',
  campaign_title: 'Weekly',
  list_id: LIST_ID,
  send_time: SENT,
  ...overrides,
});

const clickers = (...emails: string[]) =>
  emails.map(email_address => ({ email_address }));

describe('MailchimpCampaignClicksService', () => {
  const recorder = { recordAddressSignals: vi.fn() };
  const prisma = { emailQualityEvent: { findMany: vi.fn() } };
  let service: MailchimpCampaignClicksService;

  beforeEach(async () => {
    vi.clearAllMocks();
    recorder.recordAddressSignals.mockResolvedValue(undefined);
    prisma.emailQualityEvent.findMany.mockResolvedValue([]);
    reports.getAllCampaignReports.mockResolvedValue({ reports: [report()] });
    reports.getCampaignClickDetails.mockResolvedValue({
      urls_clicked: [{ id: 'url-1', url: 'https://example.com/a' }],
    });
    reports.getSubscribersInfo.mockResolvedValue({ members: [] });

    const module = await Test.createTestingModule({
      providers: [
        MailchimpCampaignClicksService,
        { provide: PrismaClient, useValue: prisma },
        { provide: EMAIL_QUALITY_RECORDER, useValue: recorder },
      ],
    }).compile();

    service = module.get(MailchimpCampaignClicksService);
  });

  it('asks for the campaigns sent since the lookback, a page at a time', async () => {
    const since = new Date('2026-10-14T00:00:00Z');

    await service.record(LIST_ID, since);

    expect(reports.getAllCampaignReports).toHaveBeenCalledWith(
      expect.objectContaining({ since_send_time: since.toISOString(), count: 100 })
    );
  });

  it('records one click per person and campaign, dated by the send time', async () => {
    reports.getCampaignClickDetails.mockResolvedValue({
      urls_clicked: [
        { id: 'url-1', url: 'https://example.com/a' },
        { id: 'url-2', url: 'https://example.com/b' },
      ],
    });
    reports.getSubscribersInfo
      .mockResolvedValueOnce({ members: clickers('Jane@Example.com', 'bob@example.com') })
      .mockResolvedValueOnce({ members: [] })
      .mockResolvedValueOnce({ members: clickers('jane@example.com') })
      .mockResolvedValueOnce({ members: [] });

    const result = await service.record(LIST_ID, new Date('2026-10-14'));

    expect(result).toEqual({ campaigns: 1, recorded: 2 });
    expect(recorder.recordAddressSignals).toHaveBeenCalledTimes(2);
    expect(recorder.recordAddressSignals).toHaveBeenCalledWith({
      email: 'jane@example.com',
      signals: [
        {
          type: EmailQualityEventType.clicked,
          email: 'jane@example.com',
          detail: 'mailchimp:list-1: Weekly',
          occurredAt: new Date(SENT),
          providerEventId: 'mailchimp-campaign:camp-1:jane@example.com',
        },
      ],
      source: EmailQualityEventSource.poll,
    });
  });

  it('pages through the clickers of a link', async () => {
    reports.getSubscribersInfo
      .mockResolvedValueOnce({ members: clickers('a@example.com') })
      .mockResolvedValueOnce({ members: clickers('b@example.com') })
      .mockResolvedValueOnce({ members: [] });

    const result = await service.record(LIST_ID, new Date('2026-10-14'));

    expect(result.recorded).toBe(2);
    expect(reports.getSubscribersInfo).toHaveBeenNthCalledWith(
      2,
      'camp-1',
      'url-1',
      expect.objectContaining({ offset: 1000 })
    );
  });

  it('leaves campaigns of another audience alone', async () => {
    reports.getAllCampaignReports.mockResolvedValue({
      reports: [report({ id: 'other', list_id: 'list-2' })],
    });

    const result = await service.record(LIST_ID, new Date('2026-10-14'));

    expect(result).toEqual({ campaigns: 0, recorded: 0 });
    expect(reports.getCampaignClickDetails).not.toHaveBeenCalled();
  });

  it('skips clicks recorded on an earlier night', async () => {
    reports.getSubscribersInfo
      .mockResolvedValueOnce({ members: clickers('a@example.com', 'b@example.com') })
      .mockResolvedValueOnce({ members: [] });
    prisma.emailQualityEvent.findMany.mockResolvedValue([
      { providerEventId: 'mailchimp-campaign:camp-1:a@example.com' },
    ]);

    const result = await service.record(LIST_ID, new Date('2026-10-14'));

    expect(result.recorded).toBe(1);
    expect(recorder.recordAddressSignals).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'b@example.com' })
    );
  });

  it('carries on with the next campaign when one cannot be read', async () => {
    reports.getAllCampaignReports.mockResolvedValue({
      reports: [report({ id: 'broken' }), report({ id: 'fine' })],
    });
    reports.getCampaignClickDetails
      .mockRejectedValueOnce(new Error('404'))
      .mockResolvedValueOnce({
        urls_clicked: [{ id: 'url-1', url: 'https://example.com/a' }],
      });
    reports.getSubscribersInfo
      .mockResolvedValueOnce({ members: clickers('a@example.com') })
      .mockResolvedValueOnce({ members: [] });

    const result = await service.record(LIST_ID, new Date('2026-10-14'));

    expect(result).toEqual({ campaigns: 2, recorded: 1 });
  });
});
