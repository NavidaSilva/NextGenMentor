import React from 'react';
export function Searchtag({ name, onRemove }) {
  return (
    <div className="tag">
      <span>{name}</span>
      <button type="button" onClick={onRemove} className="tag-close">
        ×
      </button>
    </div>
  );
}