import React, { useState } from 'react';
import Account from '../mentee/account';
import Privacy from '../mentee/privacy';
import Help from '../mentee/help';

import DeleteAccount from '../mentee/deleteaccount';
import '../mentee/menteesettings.css';

const options = [
  { id: 'account', label: 'Account' },
  { id: 'privacy', label: 'Privacy' },

  { id: 'helpSupport', label: 'Help and Support' },
  { id: 'deleteAccount', label: 'Delete Account' },
];

export default function Settings() {
  const [selected, setSelected] = useState('account');

  const renderContent = () => {
    switch (selected) {
      case 'account':
        return <Account />;
      case 'privacy':
        return <Privacy />;

      case 'helpSupport':
        return <Help />;
      case 'deleteAccount':
        return <DeleteAccount />;
      default:
        return <Account />;
    }
  };

  return (
    <div className="settings-container">
      <aside className="settings-sidebar">
        <h2>Settings</h2>
        <nav className="settings-nav">
          {options.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={selected === id ? 'selected' : ''}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="settings-main">{renderContent()}</main>
    </div>
  );
}
