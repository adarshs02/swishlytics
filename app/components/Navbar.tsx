"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Rankings' },
    { href: '/projections', label: 'Projections' },
    { href: '#', label: 'Matchup Tool' }, // Placeholder
    { href: '#', label: 'Articles' },     // Placeholder
  ];

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        {/*
        <button
          onClick={() => router.push('/')}
          className="text-3xl font-extrabold text-blue-500 hover:text-blue-400 transition-colors duration-300"
        >
          Swishlytics Home
        </button>
        */}
        <div className="flex items-center space-x-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isPlaceholder = item.href === '#';
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (!isPlaceholder) {
                    router.push(item.href);
                  }
                }}
                className={`px-6 py-3 rounded-full text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : isPlaceholder
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                disabled={isPlaceholder}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;