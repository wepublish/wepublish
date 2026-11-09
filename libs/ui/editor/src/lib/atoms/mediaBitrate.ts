export function formatBitrate(
  fileSize: number,
  duration?: number | null
): string | undefined {
  if (!duration || duration <= 0) {
    return undefined;
  }

  const bitsPerSecond = (fileSize * 8) / duration;

  if (bitsPerSecond >= 1_000_000) {
    return `${(bitsPerSecond / 1_000_000).toFixed(1)} Mbps`;
  }

  return `${Math.round(bitsPerSecond / 1000)} kbps`;
}
