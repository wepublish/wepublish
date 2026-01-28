import { BuilderImageProps } from './image.interface';
import { useWebsiteBuilder } from './website-builder.context';
import { forwardRef } from 'react';

export const Image = forwardRef<HTMLImageElement, BuilderImageProps>(
  (props, ref) => {
    const {
      elements: { Image },
    } = useWebsiteBuilder();

    return (
      <Image
        {...props}
        ref={ref}
      />
    );
  }
);
