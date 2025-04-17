import { ReactNode } from 'react';
import { useLocation } from 'wouter';

// Custom NavLink component that prevents default behavior and uses client-side navigation
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const [, navigate] = useLocation();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };
  
  return (
    <a href={href} onClick={handleClick}>
      {children}
    </a>
  );
}