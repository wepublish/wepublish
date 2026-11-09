import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CanCreateVideo } from '@wepublish/permissions';

import { AuthContext } from '../authContext';
import { VideoEditPanel } from './videoEditPanel';

const save = vi.fn(async () => ({ data: { updateVideo: video } }));
const upload = vi.fn(async () => ({ data: { uploadVideo: video } }));
const query = vi.fn(async () => ({ data: { video } }));

vi.mock('../atoms/captureVideoPoster', () => ({
  captureVideoPoster: async () => new Blob(['jpeg'], { type: 'image/jpeg' }),
}));

vi.mock('../atoms/readMediaMetadata', () => ({
  readMediaMetadata: async () => ({
    duration: 29.5,
    width: 1920,
    height: 1080,
  }),
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: (document: unknown) => [
    JSON.stringify(document).includes('uploadVideo') ? upload : save,
    { loading: false },
  ],
  useApolloClient: () => ({ query }),
}));

const video = {
  id: 'video-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-02-03T10:00:00.000Z',
  filename: 'rehearsal',
  extension: '.mp4',
  fileSize: 2048,
  title: 'Rehearsal, act two',
  description: 'The second act, end to end',
  url: 'https://media.test/video/video-1/rehearsal.mp4',
};

const theme = createTheme({ cssVariables: true });

const session = {
  sessionRoles: [{ id: 'role', name: 'admin', permissions: [CanCreateVideo] }],
} as never;

const panel = (props: { id?: string; file?: File; onReplace?(): void }) => (
  <ThemeProvider theme={theme}>
    <AuthContext.Provider value={{ session } as never}>
      <VideoEditPanel {...props} />
    </AuthContext.Provider>
  </ThemeProvider>
);

const renderPanel = (
  props: {
    id?: string;
    file?: File;
    onReplace?(): void;
  } = {}
) => render(panel(props));

const titleField = () => screen.getByRole('textbox', { name: /title/i });

describe('VideoEditPanel', () => {
  beforeEach(() => {
    save.mockClear();
    upload.mockClear();
    query.mockClear();
    query.mockResolvedValue({ data: { video } });
  });

  it('opens on the title and description of the video it was given', async () => {
    renderPanel({ id: 'video-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    expect(
      screen.getByRole('textbox', { name: /videos.panels.description/i })
    ).toHaveValue('The second act, end to end');
  });

  it('shows the video it loaded, not a parallel copy of it', async () => {
    renderPanel({ id: 'video-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    expect(
      screen.getByRole('link', { name: 'videos.panels.openOriginal' })
    ).toHaveAttribute('href', video.url);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('keeps what the user typed across a re-render', async () => {
    const { rerender } = renderPanel({ id: 'video-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    fireEvent.change(titleField(), { target: { value: 'Half-typed title' } });
    rerender(panel({ id: 'video-1' }));

    expect(titleField()).toHaveValue('Half-typed title');
  });

  it('lays its sections out as headings, the way the image drawer does', async () => {
    const { container } = renderPanel({ id: 'video-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    expect(
      screen.getByRole('heading', { name: 'videos.panels.information' })
    ).toBeInTheDocument();
    expect(container.querySelector('.MuiCard-root')).toBeNull();
  });

  it('saves what the form holds, not what was loaded', async () => {
    renderPanel({ id: 'video-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    fireEvent.change(titleField(), { target: { value: 'Rehearsal, act one' } });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].variables).toMatchObject({
      id: 'video-1',
      title: 'Rehearsal, act one',
    });
  });

  it('describes a picked file without asking the api for anything', async () => {
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    expect(await screen.findByText(/clip/)).toBeInTheDocument();
    expect(titleField()).toHaveValue('');
    expect(query).not.toHaveBeenCalled();
  });

  it('splits a picked file into a name and an extension, not both at once', async () => {
    const file = new File(['x'], 'rehearsal.take.2.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    expect(await screen.findByText('rehearsal.take.2.mp4')).toBeInTheDocument();
  });

  it('uploads the name without the extension the api adds back', async () => {
    const file = new File(['x'], 'sample.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    await waitFor(() => expect(titleField()).toHaveValue(''));
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => expect(upload).toHaveBeenCalled());
    expect(upload.mock.calls[0][0].variables.filename).toBe('sample');
  });

  it('sends the measurements it took of the picked file', async () => {
    const file = new File(['x'], 'clip', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    await waitFor(() => expect(titleField()).toHaveValue(''));
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => expect(upload).toHaveBeenCalled());
    expect(upload.mock.calls[0][0].variables).toMatchObject({
      duration: 29.5,
      width: 1920,
      height: 1080,
    });
  });

  it('sends a frame grabbed from the video as its thumbnail', async () => {
    const file = new File(['x'], 'clip', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    await waitFor(() => expect(titleField()).toHaveValue(''));
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => expect(upload).toHaveBeenCalled());

    const { poster } = upload.mock.calls[0][0].variables;
    expect(poster).toBeInstanceOf(File);
    expect(poster.type).toBe('image/jpeg');
  });

  it('plays the picked file back before it has been uploaded', async () => {
    const file = new File(['x'], 'clip', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 4096 });

    const createObjectURL = vi.spyOn(URL, 'createObjectURL');

    renderPanel({ file });

    await waitFor(() => expect(titleField()).toHaveValue(''));

    expect(createObjectURL).toHaveBeenCalledWith(file);
    createObjectURL.mockRestore();
  });

  it('offers no public link for a file that is not uploaded yet', async () => {
    const file = new File(['x'], 'clip', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    await waitFor(() => expect(titleField()).toHaveValue(''));

    expect(screen.queryByText('videos.panels.publicLink')).toBeNull();
    expect(screen.queryByText('videos.panels.openOriginal')).toBeNull();
  });

  it('lets the user go back and pick a different file', async () => {
    const onReplace = vi.fn();
    const file = new File(['x'], 'clip', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 4096 });

    render(panel({ file, onReplace }));

    await waitFor(() => expect(titleField()).toHaveValue(''));
    fireEvent.click(
      screen.getByRole('button', { name: 'videos.panels.replaceFile' })
    );

    expect(onReplace).toHaveBeenCalled();
  });

  it('says so when the video is not there', async () => {
    query.mockResolvedValue({ data: { video: null } } as never);

    renderPanel({ id: 'gone' });

    await waitFor(() => expect(query).toHaveBeenCalled());
    expect(titleField()).toHaveValue('');
  });
});
