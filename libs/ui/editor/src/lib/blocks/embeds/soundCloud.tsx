export interface SoundCloudTrackEmbedProps {
  trackID: string | null | undefined;
}

export const SoundCloudTrackEmbed = ({ trackID }: SoundCloudTrackEmbedProps) =>
  trackID && (
    <iframe
      src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${encodeURIComponent(
        trackID
      )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
      width="100%"
      height="300"
      title="soundcloud-track"
      scrolling="no"
      frameBorder="0"
    />
  );
