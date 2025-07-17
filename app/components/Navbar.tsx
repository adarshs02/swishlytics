"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '#', label: 'Blog' },     // Placeholder
    { href: '#', label: 'Forum' },     // Placeholder
    { href: '/', label: 'Player Rankings' },
    { href: '/projections', label: 'Player Projections' },
    { href: '#', label: 'Tools' }, // Placeholder
    { href: '/login', label: 'Login' }
  ];

  return (
    <nav>
      <div className="container mx-auto flex justify-center items-center">
        <div className="flex items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isPlaceholder = item.href === '#';
            
            // Combine classes conditionally
            const buttonClass = [
              'nav-button',
              isActive ? 'active' : '',
            ].join(' ');

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (!isPlaceholder) {
                    router.push(item.href);
                  }
                }}
                className={buttonClass}
                disabled={isPlaceholder}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;