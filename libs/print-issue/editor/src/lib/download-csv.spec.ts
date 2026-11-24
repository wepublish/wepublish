import { downloadCsv } from './download-csv';

describe('downloadCsv', () => {
  it('saves the file under the name the API chose, as is', () => {
    const click = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:csv');
    const revokeObjectURL = vi.fn();
    const link = {
      href: '',
      setAttribute: vi.fn(),
      click,
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(link);
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    downloadCsv('﻿"Quelle"\r\n', 'druckliste-1.27-2027-01-15.csv');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(link.setAttribute).toHaveBeenCalledWith(
      'download',
      'druckliste-1.27-2027-01-15.csv'
    );
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');
  });
});
