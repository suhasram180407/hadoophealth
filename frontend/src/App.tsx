import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { HdfsBrowserPage } from './pages/HdfsBrowserPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { IngestionPage } from './pages/IngestionPage';
import { HealthStatus, SystemStatus, IngestionStatus } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [ingestion, setIngestion] = useState<IngestionStatus | null>(null);

  const refreshGlobalState = async () => {
    try {
      const [h, s, ing] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getSystemStatus().catch(() => null),
        api.getIngestionStatus().catch(() => null),
      ]);
      if (h) setHealth(h);
      if (s) setSystem(s);
      if (ing) setIngestion(ing);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    refreshGlobalState();
    const interval = setInterval(refreshGlobalState, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  const handleBackToPatients = () => {
    setSelectedPatientId(null);
    setActiveTab('patients');
  };

  const handleTabChange = (tab: ActiveTab) => {
    setSelectedPatientId(null);
    setActiveTab(tab);
    refreshGlobalState();
  };

  const getPageTitle = (): string => {
    if (selectedPatientId) return 'Patient Profile & Clinical History';
    switch (activeTab) {
      case 'dashboard':
        return 'Healthcare Data Storage Dashboard';
      case 'patients':
        return 'Structured Patients Directory (HBase)';
      case 'hdfs':
        return 'HDFS Raw Storage Explorer (/healthcare/raw)';
      case 'system':
        return 'System Health & Node Status';
      case 'ingestion':
        return 'Healthcare Data Ingestion Pipeline';
      default:
        return 'Healthcare Data Platform';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        patientCount={system?.hbase_table?.row_count}
        hdfsCount={system?.dataset?.total_files}
      />

      <div className="main-content">
        <Header
          title={getPageTitle()}
          health={health}
          onRefresh={refreshGlobalState}
        />

        <main className="content-body">
          {selectedPatientId ? (
            <PatientDetailPage
              patientId={selectedPatientId}
              onBack={handleBackToPatients}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  system={system}
                  ingestion={ingestion}
                  onNavigate={handleTabChange}
                />
              )}
              {activeTab === 'patients' && (
                <PatientsPage onSelectPatient={handleSelectPatient} />
              )}
              {activeTab === 'hdfs' && <HdfsBrowserPage />}
              {activeTab === 'system' && <SystemStatusPage />}
              {activeTab === 'ingestion' && <IngestionPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
