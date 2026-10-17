import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { IncomingVisitorModal } from './components/IncomingVisitorModal';
import { SosButton } from './components/SosButton';
import { PermissionPromptBanner } from './components/PermissionPromptBanner';
import { DashboardView } from './views/DashboardView';
import { BillingView } from './views/BillingView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { VisitorRegistryView } from './views/VisitorRegistryView';
import { MembersView } from './views/MembersView';
import { StaffView } from './views/StaffView';
import { HomeServicesView } from './views/HomeServicesView';
import { EventCalendarView } from './views/EventCalendarView';
import { NeighborhoodView } from './views/NeighborhoodView';
import { GateSyncDownloadsView } from './views/GateSyncDownloadsView';

const MainLayout = () => {
  const { activeTab, setActiveTab } = useApp();

  // Support direct hash navigation (e.g. #/registry, #/billing) for GitHub Pages deep links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, setActiveTab]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'billing':
        return <BillingView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'registry':
        return <VisitorRegistryView />;
      case 'members':
        return <MembersView />;
      case 'staff':
        return <StaffView />;
      case 'services':
        return <HomeServicesView />;
      case 'events':
        return <EventCalendarView />;
      case 'neighborhood':
        return <NeighborhoodView />;
      case 'downloads':
        return <GateSyncDownloadsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="page-content">
          {renderActiveView()}
        </main>
      </div>

      {/* Global In-App Alerting Modals & Floating Triggers */}
      <IncomingVisitorModal />
      <SosButton />
      <PermissionPromptBanner />
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <MainLayout />
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  );
}
