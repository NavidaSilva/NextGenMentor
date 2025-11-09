import React from 'react';
export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5fcf80] ${className}`}
      {...props}
    />
  );
}