import React from 'react';
export function Card({ children }) {
  return <div className="bg-white rounded-xl shadow p-2">{children}</div>;
}

export function CardContent({ children }) {
  return <div className="mt-2">{children}</div>;
}