import React, { useState } from 'react';
import { StudentProvider, useStudent } from './context/StudentContext';
import { Header } from './components/Common/Header';
import { OfferingList } from './components/Parent/OfferingList';
import { HoldModal } from './components/Parent/HoldModal';
import { MyHoldsView } from './components/Parent/MyHoldsView';
import { AdminDashboard } from './components/Admin/AdminDashboard';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'offerings' | 'my-holds' | 'admin'>('offerings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { activeHold } = useStudent();

  const handleDataRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '24px 20px', boxSizing: 'border-box' }}>
        {activeTab === 'offerings' && (
          <OfferingList
            refreshTrigger={refreshTrigger}
            onHoldCreated={handleDataRefresh}
          />
        )}

        {activeTab === 'my-holds' && (
          <MyHoldsView
            refreshTrigger={refreshTrigger}
            onOpenHoldModal={handleDataRefresh}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onClassCreated={handleDataRefresh}
          />
        )}

        {/* Global Active Hold Modal */}
        {activeHold && <HoldModal onHoldUpdated={handleDataRefresh} />}
      </main>

      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '16px 20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>
            School Admission System • Assistant Software Engineer Take-Home Assignment
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Backend API: <code>http://localhost:8080</code></span>
            <span>Frontend UI: <code>http://localhost:5173</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <StudentProvider>
      <MainContent />
    </StudentProvider>
  );
};

export default App;
