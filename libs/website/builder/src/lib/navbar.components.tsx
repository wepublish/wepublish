import { BuilderNavbarProps } from './navbar.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Navbar = (props: BuilderNavbarProps) => {
  const { Navbar } = useWebsiteBuilder();

  return <Navbar {...props} />;
};
