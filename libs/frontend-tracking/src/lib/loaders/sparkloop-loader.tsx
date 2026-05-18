import Script from 'next/script';

export interface SparkloopLoaderProps {
  teamId: string;
}

export function SparkloopLoader({ teamId }: SparkloopLoaderProps) {
  return (
    <Script
      id={`sparkloop-${teamId}`}
      src={`https://script.sparkloop.app/team_${teamId}.js`}
      strategy="afterInteractive"
      async
      data-sparkloop-team-id={teamId}
    />
  );
}
