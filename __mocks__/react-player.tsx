import { forwardRef, Ref } from 'react';

const ReactPlayer = forwardRef(function ReactPlayer(
  { src, className }: { src?: string; className?: string },
  ref: Ref<HTMLDivElement>
) {
  return (
    <div ref={ref} className={className}>
      ReactPlayer Mock: {src}
    </div>
  );
});

export default ReactPlayer;
