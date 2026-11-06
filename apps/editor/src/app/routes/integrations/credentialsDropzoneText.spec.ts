import { credentialsDropzoneText } from './credentialsDropzoneText';

const text = (state: Parameters<typeof credentialsDropzoneText>[0]) =>
  credentialsDropzoneText(state, key => key);

describe('credentialsDropzoneText', () => {
  it('says stored credentials are kept unless a new file is dropped', () => {
    expect(text({ dragging: false, newFile: false, stored: true })).toBe(
      'integrations.analyticsSettings.credentialsStored'
    );
  });

  it('asks for the file when none is stored', () => {
    expect(text({ dragging: false, newFile: false, stored: false })).toBe(
      'integrations.analyticsSettings.dragCredentialsFileHere'
    );
  });

  it('confirms a new file over the stored one', () => {
    expect(text({ dragging: false, newFile: true, stored: true })).toBe(
      'integrations.analyticsSettings.credentialsReadyToBeSaved'
    );
  });

  it('invites the drop while dragging', () => {
    expect(text({ dragging: true, newFile: false, stored: true })).toBe(
      'integrations.analyticsSettings.dropCredentialsFile'
    );
  });
});
