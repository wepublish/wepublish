import styled from '@emotion/styled';

const Iframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const YouTubeEmbed = styled.div`
  position: relative;
  padding-top: 56.25%;
  width: 100%;
`;

export interface YouTubeVideoEmbedProps {
  videoID: string | null | undefined;
}

export function YouTubeVideoEmbed({ videoID }: YouTubeVideoEmbedProps) {
  return (
    <YouTubeEmbed>
      {videoID && (
        <Iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoID)}`}
          allowFullScreen
        />
      )}
    </YouTubeEmbed>
  );
}
