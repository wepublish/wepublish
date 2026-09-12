import { BuilderFooterProps } from './footer.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Footer = (props: BuilderFooterProps) => {
  const { Footer } = useWebsiteBuilder();

  return <Footer {...props} />;
};
