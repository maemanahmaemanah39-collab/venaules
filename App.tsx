import React, { useState, useEffect } from 'react';
import { ViewType, User, Profile, NavigationAction, Notification } from './types';
import { HomeIcon, FolderKanbanIcon, UsersIcon, DollarSignIcon, lightenColor, darkenColor, hexToHsl } from './constants';
import SupabaseService from './lib/supabaseService';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { Leads } from './components/Leads';
import Booking from './components/Booking';
import Clients from './components/Clients';
import { Projects } from './components/Projects';
import { Freelancers } from './components/Freelancers';
import Finance from './components/Finance';
import Packages from './components/Packages';
import { Assets } from './components/Assets';
import Settings from './components/Settings';
import { CalendarView } from './components/CalendarView';
import Login from './components/Login';
import Signup from './components/Signup';
import PublicBookingForm from './components/PublicBookingForm';
import PublicPackages from './components/PublicPackages';
import PublicFeedbackForm from './components/PublicFeedbackForm';
import PublicRevisionForm from './components/PublicRevisionForm';
import PublicLeadForm from './components/PublicLeadForm';
import Header from './components/Header';
import SuggestionForm from './components/SuggestionForm';
import ClientReports from './components/ClientKPI';
import GlobalSearch from './components/GlobalSearch';
import Contracts from './components/Contracts';
import ClientPortal from './components/ClientPortal';
import FreelancerPortal from './components/FreelancerPortal';
import { SocialPlanner } from './components/SocialPlanner';
import PromoCodes from './components/PromoCodes';
import SOPManagement from './components/SOP';
import Homepage from './components/Homepage';

const useSupabaseItem = <T,>(fetcher: () => Promise<T | null>, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const result = await fetcher();
                setData(result || defaultValue);
            } catch (error) {
                console.error('Error loading item from Supabase:', error);
                setData(defaultValue);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [fetcher, defaultValue]);

    return [data, setData, loading];
};

const AccessDenied: React.FC<{onBackToDashboard: () => void}> = ({ onBackToDashboard }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6 md:p-8 animate-fade-in">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mb-2 sm:mb-3">Akses Ditolak</h2>
        <p className="text-brand-text-secondary mb-6 sm:mb-8 max-w-md leading-relaxed">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <button onClick={onBackToDashboard} className="button-primary">Kembali ke Dashboard</button>
    </div>
);

const BottomNavBar: React.FC<{ activeView: ViewType; handleNavigation: (view: ViewType) => void }> = ({ activeView, handleNavigation }) => {
    const navItems = [
        { view: ViewType.DASHBOARD, label: 'Beranda', icon: HomeIcon },
        { view: ViewType.PROJECTS, label: 'Proyek', icon: FolderKanbanIcon },
        { view: ViewType.CLIENTS, label: 'Klien', icon: UsersIcon },
        { view: ViewType.FINANCE, label: 'Keuangan', icon: DollarSignIcon },
    ];
    return (
        <nav className="bottom-nav xl:hidden bg-brand-surface/95 backdrop-blur-xl border-t border-brand-border/50">
            <div className="flex justify-around items-center h-16 px-2" style={{paddingBottom: 'var(--safe-area-inset-bottom, 0px)'}}>
                {navItems.map(item => (
                    <button key={item.view} onClick={() => handleNavigation(item.view)} className={`flex flex-col items-center justify-center w-full h-full px-2 py-2 rounded-xl transition-all duration-200 min-w-[64px] min-h-[48px] relative group ${activeView === item.view ? 'text-brand-accent bg-brand-accent/10' : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-input/50 active:bg-brand-input'}`} aria-label={item.label}>
                        <div className="relative mb-1"><item.icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${activeView === item.view ? 'transform scale-110' : 'group-active:scale-95'}`} />{activeView === item.view && (<div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-accent animate-pulse-soft" />)}</div>
                        <span className={`text-xs font-semibold leading-tight transition-all duration-200 ${activeView === item.view ? 'font-bold' : ''}`}>{item.label}</span>
                        <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${activeView === item.view ? 'bg-gradient-to-t from-brand-accent/10 to-transparent' : 'bg-transparent group-hover:bg-brand-input/30'}`} />
                    </button>
                ))}
            </div>
        </nav>
    );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>(ViewType.HOMEPAGE);
  const [notification, setNotification] = useState<string>('');
  const [initialAction, setInitialAction] = useState<NavigationAction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [route, setRoute] = useState(window.location.hash || '#/home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global state that remains: Auth, Profile (for header), Notifications (for header), and UI state.
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuthAndGlobalData = async () => {
      setAuthLoading(true);
      setLoading(true);
      try {
        const session = await SupabaseService.getCurrentSession();
        if (session) {
          const [user, primaryProfile, fetchedNotifications] = await Promise.all([
            SupabaseService.getCurrentUser(),
            SupabaseService.getPrimaryProfile(),
            SupabaseService.getNotifications()
          ]);
          setCurrentUser(user);
          setProfile(primaryProfile);
          setNotifications(fetchedNotifications);
          setIsAuthenticated(!!user);
        }
      } catch (error) {
        console.error('Auth and global data initialization error:', error);
      }
      setAuthLoading(false);
      setLoading(false);
    };
    initAuthAndGlobalData();

    const { data: { subscription } } = SupabaseService.onAuthStateChange(async (event, session) => {
      if (session) {
        const user = await SupabaseService.getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(!!user);
        if (user) { // If user is logged in, fetch their profile
            const primaryProfile = await SupabaseService.getPrimaryProfile();
            setProfile(primaryProfile);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setProfile(null); // Clear profile on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendEmailNotification = (recipientEmail: string, notification: Notification) => {
    console.log(`[SIMULASI EMAIL] Mengirim notifikasi ke: ${recipientEmail}. Judul: ${notification.title}`);
  };

  const addNotification = async (newNotificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), isRead: false, ...newNotificationData };
    try {
      const savedNotification = await SupabaseService.createNotification(newNotification);
      setNotifications(prev => [savedNotification, ...prev]);
      if (profile?.email) sendEmailNotification(profile.email, savedNotification);
    } catch (error) {
      console.error('Error saving notification:', error);
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = window.location.hash || '#/home';
      setRoute(newRoute);
      const isPublicRoute = newRoute.startsWith('#/public') || newRoute.startsWith('#/feedback') || newRoute.startsWith('#/suggestion') || newRoute.startsWith('#/revision') || newRoute.startsWith('#/portal') || newRoute.startsWith('#/freelancer-portal') || newRoute.startsWith('#/login') || newRoute.startsWith('#/signup') || newRoute === '#/home' || newRoute === '#';

      if (isAuthenticated) {
        if (isPublicRoute || newRoute === '#/login' || newRoute === '#/signup' || newRoute === '#/home') {
          window.location.hash = '#/dashboard';
        }
      } else if (!isPublicRoute) {
        window.location.hash = '#/home';
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  useEffect(() => {
      const path = (route.split('?')[0].split('/')[1] || 'home').toLowerCase();
      const newView = Object.values(ViewType).find(v => v.toLowerCase().replace(/ /g, '-') === path) || ViewType.HOMEPAGE;
      if (hasPermission(newView)) {
        setActiveView(newView);
      } else if (isAuthenticated) { // If logged in but no permission, show dashboard
        setActiveView(ViewType.DASHBOARD);
      }
  }, [route, currentUser]);
  
  useEffect(() => {
    const styleElement = document.getElementById('public-theme-style');
    const isPublicRoute = route.startsWith('#/public') || route.startsWith('#/portal') || route.startsWith('#/freelancer-portal');
    document.body.classList.toggle('app-theme', !isPublicRoute);
    document.body.classList.toggle('public-page-body', isPublicRoute);

    if (isPublicRoute && profile) {
      const brandColor = profile.brandColor || '#3b82f6';
      if (styleElement) {
        styleElement.innerHTML = `:root { --public-accent: ${brandColor}; --public-accent-hover: ${darkenColor(brandColor, 10)}; --public-accent-hsl: ${hexToHsl(brandColor)}; }`;
      }
    } else if (styleElement) {
      styleElement.innerHTML = '';
    }
  }, [route, profile]);

  const showNotification = (message: string, duration: number = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(''), duration);
  };

  const handleLoginSuccess = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    window.location.hash = '#/dashboard';
  };
  
  const handleLogout = async () => {
    await SupabaseService.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.hash = '#/home';
    showNotification('Anda telah keluar dari sistem.');
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    try { await SupabaseService.updateNotification(notificationId, { isRead: true }); } catch (e) { console.error(e); }
  };
  
  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        await Promise.all(unreadIds.map(id => SupabaseService.updateNotification(id, { isRead: true })));
    } catch(e) { console.error(e); }
  };

  const handleNavigation = (view: ViewType, action?: NavigationAction, notificationId?: string) => {
    const pathMap: { [key in ViewType]: string } = {
        [ViewType.HOMEPAGE]: 'home', [ViewType.DASHBOARD]: 'dashboard', [ViewType.PROSPEK]: 'prospek', [ViewType.BOOKING]: 'booking', [ViewType.CLIENTS]: 'clients', [ViewType.PROJECTS]: 'projects', [ViewType.TEAM]: 'team', [ViewType.FINANCE]: 'finance', [ViewType.CALENDAR]: 'calendar', [ViewType.SOCIAL_MEDIA_PLANNER]: 'social-media-planner', [ViewType.PACKAGES]: 'packages', [ViewType.ASSETS]: 'assets', [ViewType.CONTRACTS]: 'contracts', [ViewType.PROMO_CODES]: 'promo-codes', [ViewType.SOP]: 'sop', [ViewType.CLIENT_REPORTS]: 'client-reports', [ViewType.SETTINGS]: 'settings',
    };
    window.location.hash = `#/${pathMap[view] || view.toLowerCase().replace(/ /g, '-')}`;
    setInitialAction(action || null);
    setIsSidebarOpen(false);
    setIsSearchOpen(false);
    if (notificationId) handleMarkAsRead(notificationId);
  };

  const hasPermission = (view: ViewType) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    return currentUser.permissions?.includes(view) || false;
  };
  
  const renderView = () => {
    if (!hasPermission(activeView)) return <AccessDenied onBackToDashboard={() => handleNavigation(ViewType.DASHBOARD)} />;
    switch (activeView) {
      case ViewType.DASHBOARD: return <Dashboard handleNavigation={handleNavigation} currentUser={currentUser} />;
      case ViewType.PROSPEK: return <Leads showNotification={showNotification} />;
      case ViewType.BOOKING: return <Booking handleNavigation={handleNavigation} showNotification={showNotification} />;
      case ViewType.CLIENTS: return <Clients showNotification={showNotification} initialAction={initialAction} setInitialAction={setInitialAction} handleNavigation={handleNavigation} />;
      case ViewType.PROJECTS: return <Projects initialAction={initialAction} setInitialAction={setInitialAction} showNotification={showNotification} addNotification={addNotification} />;
      case ViewType.TEAM: return <Freelancers showNotification={showNotification} initialAction={initialAction} setInitialAction={setInitialAction} />;
      case ViewType.FINANCE: return <Finance />;
      case ViewType.PACKAGES: return <Packages showNotification={showNotification} />;
      case ViewType.ASSETS: return <Assets showNotification={showNotification} />;
      case ViewType.CONTRACTS: return <Contracts showNotification={showNotification} initialAction={initialAction} setInitialAction={setInitialAction} />;
      case ViewType.SOP: return <SOPManagement showNotification={showNotification} />;
      case ViewType.SETTINGS: return <Settings currentUser={currentUser} showNotification={showNotification} />;
      case ViewType.CALENDAR: return <CalendarView />;
      case ViewType.CLIENT_REPORTS: return <ClientReports showNotification={showNotification} />;
      case ViewType.SOCIAL_MEDIA_PLANNER: return <SocialPlanner showNotification={showNotification} />;
      case ViewType.PROMO_CODES: return <PromoCodes showNotification={showNotification} />;
      default: return <div />;
    }
  };
  
  // --- ROUTING LOGIC ---
  if (route.startsWith('#/home') || route === '#/') return <Homepage />;
  if (route.startsWith('#/login')) return <Login onLoginSuccess={handleLoginSuccess} />;
  if (route.startsWith('#/signup')) return <Signup />;
  if (route.startsWith('#/public-packages')) return <PublicPackages showNotification={showNotification} addNotification={addNotification} />;
  if (route.startsWith('#/public-booking')) return <PublicBookingForm showNotification={showNotification} addNotification={addNotification} />;
  if (route.startsWith('#/public-lead-form')) return <PublicLeadForm showNotification={showNotification} addNotification={addNotification} />;
  if (route.startsWith('#/feedback')) return <PublicFeedbackForm />;
  if (route.startsWith('#/suggestion-form')) return <SuggestionForm showNotification={showNotification} />;
  if (route.startsWith('#/revision-form')) return <PublicRevisionForm />;
  if (route.startsWith('#/portal/')) {
    const accessId = route.split('/portal/')[1];
    return <ClientPortal accessId={accessId} showNotification={showNotification} />;
  }
  if (route.startsWith('#/freelancer-portal/')) {
     const accessId = route.split('/freelancer-portal/')[1];
     return <FreelancerPortal accessId={accessId} showNotification={showNotification} />;
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen bg-brand-bg text-brand-text-primary"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div></div>;
  }
  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="flex h-screen bg-brand-bg text-brand-text-primary overflow-hidden">
      <Sidebar activeView={activeView} setActiveView={(view) => handleNavigation(view)} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentUser={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header pageTitle={activeView} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} setIsSearchOpen={setIsSearchOpen} notifications={notifications} handleNavigation={handleNavigation} handleMarkAllAsRead={handleMarkAllAsRead} currentUser={currentUser} profile={profile} handleLogout={handleLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 pb-20 xl:pb-8 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(5rem + var(--safe-area-inset-bottom, 0px))'}}>
            <div className="animate-fade-in">
                {loading ? (
                    <div className="flex items-center justify-center h-64"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div><p className="text-brand-text-secondary">Memuat data...</p></div></div>
                ) : (
                    renderView()
                )}
            </div>
        </main>
      </div>
      {notification && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 bg-brand-accent text-white py-3 px-4 sm:py-4 sm:px-6 rounded-xl shadow-2xl z-50 animate-fade-in-out backdrop-blur-sm border border-brand-accent-hover/20 max-w-sm break-words" style={{top: 'calc(1rem + var(--safe-area-inset-top, 0px))', right: 'calc(1rem + var(--safe-area-inset-right, 0px))'}}>
          <div className="flex items-center gap-3"><div className="w-2 h-2 bg-white rounded-full animate-pulse-soft" /><span className="font-medium text-sm sm:text-base">{notification}</span></div>
        </div>
      )}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} handleNavigation={handleNavigation} />
      <BottomNavBar activeView={activeView} handleNavigation={handleNavigation} />
    </div>
  );
};

export default App;