import React from 'react';
import Navbar from './Navbar';

const Header = () => {
  return (
    <header className="bg-gray-900 text-white p-4 shadow-lg text-center">
      <h1 className="text-4xl font-extrabold text-blue-500 mb-4">Swishlytics</h1>
      <Navbar />
    </header>
  );
};

export default Header;
