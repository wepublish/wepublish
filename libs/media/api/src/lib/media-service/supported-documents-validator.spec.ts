import {
  getExtensionForMimeType,
  getMimeTypeForExtension,
  supportedDocumentMimeTypes,
} from './supported-documents-validator';

describe('getMimeTypeForExtension', () => {
  const cases: [string, string][] = [
    ['.pdf', 'application/pdf'],
    [
      '.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ['.doc', 'application/msword'],
    [
      '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    ['.xls', 'application/vnd.ms-excel'],
    [
      '.pptx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    ['.ppt', 'application/vnd.ms-powerpoint'],
    ['.odt', 'application/vnd.oasis.opendocument.text'],
    ['.ods', 'application/vnd.oasis.opendocument.spreadsheet'],
    ['.odp', 'application/vnd.oasis.opendocument.presentation'],
    ['.csv', 'text/csv'],
    ['.txt', 'text/plain'],
    ['.json', 'application/json'],
    ['.xml', 'application/xml'],
    ['.zip', 'application/zip'],
  ];

  it.each(cases)('resolves %s to %s', (extension, mimeType) => {
    expect(getMimeTypeForExtension(extension)).toBe(mimeType);
  });

  it('ignores the casing of the extension', () => {
    expect(getMimeTypeForExtension('.JSON')).toBe('application/json');
  });

  it('returns undefined for an unknown extension', () => {
    expect(getMimeTypeForExtension('.bin')).toBeUndefined();
  });

  it('resolves a content type for every supported upload format', () => {
    const unmappedMimeTypes = supportedDocumentMimeTypes.filter(
      mimeType =>
        getMimeTypeForExtension(getExtensionForMimeType(mimeType)) === undefined
    );

    expect(unmappedMimeTypes).toEqual([]);
  });
});
