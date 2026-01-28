import styled from '@emotion/styled';

const Iframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const VimeoEmbed = styled.div`
  position: relative;
  padding-top: 56.25%;
  width: 100%;
`;

export interface VimeoVideoEmbedProps {
  videoID: string | null | undefined;
}

export function VimeoVideoEmbed({ videoID }: VimeoVideoEmbedProps) {
  return (
    <VimeoEmbed>
      {videoID && (
        <Iframe
          src={`https://player.vimeo.com/video/${encodeURIComponent(videoID)}`}
          allowFullScreen
        />
      )}
    </VimeoEmbed>
  );
}
