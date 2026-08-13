import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export default function Link({ href, children, ...props }: LinkProps): JSX.Element {
  if (href.startsWith('/')) return <RouterLink to={href} {...props}>{children}</RouterLink>;
  return <a href={href} {...props}>{children}</a>;
}