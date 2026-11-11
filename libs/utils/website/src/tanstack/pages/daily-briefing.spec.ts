import { fetchDailyBriefing } from './daily-briefing';

const campaign = {
  id: 'c1',
  long_archive_url: 'https://example.ch/c1',
  settings: { subject_line: 'Was läuft' },
};

describe('fetchDailyBriefing', () => {
  it('asks mailchimp for the tenant folder, newest sent first', async () => {
    const list = vi.fn().mockResolvedValue({ campaigns: [campaign] });

    await fetchDailyBriefing(
      { count: 4, folderId: '496b1eb537' },
      { setConfig: vi.fn(), campaigns: { list } }
    );

    expect(list).toHaveBeenCalledWith({
      count: 4,
      folderId: '496b1eb537',
      sortField: 'send_time',
      sortDir: 'DESC',
      status: 'sent',
      fields: [
        'campaigns.id',
        'campaigns.long_archive_url',
        'campaigns.settings.subject_line',
      ],
    });
  });

  it('returns the campaigns it got', async () => {
    const list = vi.fn().mockResolvedValue({ campaigns: [campaign] });

    expect(
      await fetchDailyBriefing(
        { count: 4, folderId: 'f' },
        { setConfig: vi.fn(), campaigns: { list } }
      )
    ).toEqual([campaign]);
  });

  it('is empty rather than throwing when mailchimp fails', async () => {
    const list = vi.fn().mockRejectedValue(new Error('429'));

    expect(
      await fetchDailyBriefing(
        { count: 4, folderId: 'f' },
        { setConfig: vi.fn(), campaigns: { list } }
      )
    ).toEqual([]);
  });

  it('is empty when mailchimp answers with an error body', async () => {
    const list = vi.fn().mockResolvedValue({ status: 404, detail: 'nope' });

    expect(
      await fetchDailyBriefing(
        { count: 4, folderId: 'f' },
        { setConfig: vi.fn(), campaigns: { list } }
      )
    ).toEqual([]);
  });
});
