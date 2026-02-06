import styled from '@emotion/styled';

const Iframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
`;

const StreamableEmbed = styled.div`
  position: relative;
  padding-top: 56.25%; /* 16:9 Ratio */
  width: 100%;
`;

export interface StreamableVideoEmbedProps {
  videoID: string | null | undefined;
}

export function StreamableVideoEmbed({ videoID }: StreamableVideoEmbedProps) {
  return (
    <StreamableEmbed>
      {videoID && (
        <Iframe
          src={`https://streamable.com/e/${encodeURIComponent(videoID)}`}
          allowFullScreen
          allow="autoplay; encrypted-media"
          title="Streamable video"
        />
      )}
    </StreamableEmbed>
  );
}
