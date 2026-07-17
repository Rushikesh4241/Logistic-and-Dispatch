import React from 'react';

const TopBar = () => {
  return (
    <header className="bg-purple-800 shadow-lg border-b-8 border-purple-400 rounded-lg m-2">
      <div className="px-6 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider font-sans">
            Logistics &amp; Dispatch Management System
          </h2>
          <p className="text-xs md:text-sm text-purple-200 mt-1 font-medium">
            Effortlessly coordinate orders, drivers, and vehicles through a single, unified dispatch administration matrix.
          </p>
        </div>
      </div>
    </header>
  );
};

export default TopBar;