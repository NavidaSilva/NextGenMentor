import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export function Tabs({ children, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children }) {
  return <div className="flex gap-2">{children}</div>;
}

export function TabsTrigger({ value, children, className = '' }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = value === activeTab;
  return (
    <button
      className={`${className} ${isActive ? 'tabs-trigger-active' : ''}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}


export function TabsContent({ value, children }) {
  const { activeTab } = useContext(TabsContext);
  return value === activeTab ? <div className="mt-4">{children}</div> : null;
}
