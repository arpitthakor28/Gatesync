import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
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
  const { activeTab } = useApp();

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
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
