

import React, { useState, useEffect } from 'react';
import { ViewType, Client, Project, TeamMember, Transaction, Package, AddOn, TeamProjectPayment, Profile, FinancialPocket, TeamPaymentRecord, Lead, RewardLedgerEntry, User, Card, Asset, ClientFeedback, Contract, RevisionStatus, NavigationAction, Notification, SocialMediaPost, PromoCode, SOP, CardType, PocketType, VendorData } from './types';
import { MOCK_USERS, DEFAULT_USER_PROFILE, MOCK_DATA, HomeIcon, FolderKanbanIcon, UsersIcon, DollarSignIcon, PlusIcon, lightenColor, darkenColor, hexToHsl } from './constants';
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

// Hook for loading data from Supabase with local state management
const useSupabaseData = <T,>(fetcher: () => Promise<T[]>, defaultValue: T[]): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] => {
    const [data, setData] = useState<T[]>(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const result = await fetcher();
                setData(result);
            } catch (error) {
                console.error('Error loading data from Supabase:', error);
                setData(defaultValue);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return [data, setData, loading];
};

// Hook for single item from Supabase
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
    }, []);

    return [data, setData, loading];
};

// Keep simple local state for authentication (can be moved to Supabase auth later)
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                return JSON.parse(storedValue);
            }
            window.localStorage.setItem(key, JSON.stringify(defaultValue));
            return defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
};

const AccessDenied: React.FC<{onBackToDashboard: () => void}> = ({ onBackToDashboard }) => (
    <div className="
        flex flex-col items-center justify-center 
        h-full 
        text-center 
        p-4 sm:p-6 md:p-8
        animate-fade-in
    ">
        <div className="
            w-16 h-16 sm:w-20 sm:h-20
            rounded-full 
            bg-red-100 dark:bg-red-900/20
            flex items-center justify-center
            mb-4 sm:mb-6
        ">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
        </div>
        <h2 className="
            text-xl sm:text-2xl 
            font-bold 
            text-red-600 dark:text-red-400 
            mb-2 sm:mb-3
        ">
            Akses Ditolak
        </h2>
        <p className="
            text-brand-text-secondary 
            mb-6 sm:mb-8 
            max-w-md
            leading-relaxed
        ">
            Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <button 
            onClick={onBackToDashboard} 
            className="button-primary"
        >
            Kembali ke Dashboard
        </button>
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
        <nav className="
            bottom-nav 
            xl:hidden
            bg-brand-surface/95 
            backdrop-blur-xl
            border-t border-brand-border/50
        ">
            <div className="
                flex justify-around items-center 
                h-16
                px-2
            " 
            style={{
                paddingBottom: 'var(--safe-area-inset-bottom, 0px)'
            }}>
                {navItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => handleNavigation(item.view)}
                        className={`
                            flex flex-col items-center justify-center 
                            w-full h-full
                            px-2 py-2
                            rounded-xl
                            transition-all duration-200 
                            min-w-[64px] min-h-[48px]
                            relative
                            group
                            ${activeView === item.view 
                                ? 'text-brand-accent bg-brand-accent/10' 
                                : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-input/50 active:bg-brand-input'
                            }
                        `}
                        aria-label={item.label}
                    >
                        {/* Enhanced Icon */}
                        <div className="
                            relative
                            mb-1
                        ">
                            <item.icon className={`
                                w-5 h-5 sm:w-6 sm:h-6
                                transition-all duration-200
                                ${activeView === item.view ? 'transform scale-110' : 'group-active:scale-95'}
                            `} />
                            
                            {/* Active indicator dot */}
                            {activeView === item.view && (
                                <div className="
                                    absolute -top-1 -right-1
                                    w-2 h-2
                                    bg-brand-accent
                                    animate-pulse-soft
                                " />
                            )}
                        </div>
                        
                        {/* Enhanced Label */}
                        <span className={`
                            text-xs font-semibold
                            leading-tight
                            transition-all duration-200
                            ${activeView === item.view ? 'font-bold' : ''}
                        `}>
                            {item.label}
                        </span>
                        
                        {/* Background highlight */}
                        <div className={`
                            absolute inset-0
                            rounded-xl
                            transition-all duration-300
                            ${activeView === item.view 
                                ? 'bg-gradient-to-t from-brand-accent/10 to-transparent' 
                                : 'bg-transparent group-hover:bg-brand-input/30'
                            }
                        `} />
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

  // Initialize Supabase auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await SupabaseService.getCurrentSession();
        if (session) {
          const user = await SupabaseService.getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(!!user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
      setAuthLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = SupabaseService.onAuthStateChange(async (event, session) => {
      if (session) {
        const user = await SupabaseService.getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(!!user);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  const [activeView, setActiveView] = useState<ViewType>(ViewType.HOMEPAGE);
  const [notification, setNotification] = useState<string>('');
  const [initialAction, setInitialAction] = useState<NavigationAction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [route, setRoute] = useState(window.location.hash || '#/home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- State Initialization with Supabase ---
  const [users, setUsers, usersLoading] = useSupabaseData<User>(() => SupabaseService.getUsers(), JSON.parse(JSON.stringify(MOCK_USERS)));
  
  const [clients, setClients, clientsLoading] = useSupabaseData<Client>(() => SupabaseService.getClients(), JSON.parse(JSON.stringify(MOCK_DATA.clients)));
  const [projects, setProjects, projectsLoading] = useSupabaseData<Project>(() => SupabaseService.getProjects(), JSON.parse(JSON.stringify(MOCK_DATA.projects)));
  const [teamMembers, setTeamMembers, teamMembersLoading] = useSupabaseData<TeamMember>(() => SupabaseService.getTeamMembers(), JSON.parse(JSON.stringify(MOCK_DATA.teamMembers)));
  const [transactions, setTransactions, transactionsLoading] = useSupabaseData<Transaction>(() => SupabaseService.getTransactions(), JSON.parse(JSON.stringify(MOCK_DATA.transactions)));
  const [teamProjectPayments, setTeamProjectPayments, teamProjectPaymentsLoading] = useSupabaseData<TeamProjectPayment>(() => SupabaseService.getTeamProjectPayments(), JSON.parse(JSON.stringify(MOCK_DATA.teamProjectPayments)));
  const [teamPaymentRecords, setTeamPaymentRecords, teamPaymentRecordsLoading] = useSupabaseData<TeamPaymentRecord>(() => SupabaseService.getTeamPaymentRecords(), JSON.parse(JSON.stringify(MOCK_DATA.teamPaymentRecords)));
  const [pockets, setPockets, pocketsLoading] = useSupabaseData<FinancialPocket>(() => SupabaseService.getFinancialPockets(), JSON.parse(JSON.stringify(MOCK_DATA.pockets)));
  const [profile, setProfile, profileLoading] = useSupabaseItem<Profile>(() => SupabaseService.getProfile('550e8400-e29b-41d4-a716-446655440010'), JSON.parse(JSON.stringify(MOCK_DATA.profile)));
  const [leads, setLeads, leadsLoading] = useSupabaseData<Lead>(() => SupabaseService.getLeads(), JSON.parse(JSON.stringify(MOCK_DATA.leads)));
  const [rewardLedgerEntries, setRewardLedgerEntries, rewardLedgerEntriesLoading] = useSupabaseData<RewardLedgerEntry>(() => SupabaseService.getRewardLedgerEntries(), JSON.parse(JSON.stringify(MOCK_DATA.rewardLedgerEntries)));
  const [cards, setCards, cardsLoading] = useSupabaseData<Card>(() => SupabaseService.getCards(), JSON.parse(JSON.stringify(MOCK_DATA.cards)));
  const [assets, setAssets, assetsLoading] = useSupabaseData<Asset>(() => SupabaseService.getAssets(), JSON.parse(JSON.stringify(MOCK_DATA.assets)));
  const [contracts, setContracts, contractsLoading] = useSupabaseData<Contract>(() => SupabaseService.getContracts(), JSON.parse(JSON.stringify(MOCK_DATA.contracts)));
  const [clientFeedback, setClientFeedback, clientFeedbackLoading] = useSupabaseData<ClientFeedback>(() => SupabaseService.getClientFeedback(), JSON.parse(JSON.stringify(MOCK_DATA.clientFeedback)));
  const [notifications, setNotifications, notificationsLoading] = useSupabaseData<Notification>(() => SupabaseService.getNotifications(), JSON.parse(JSON.stringify(MOCK_DATA.notifications)));
  const [socialMediaPosts, setSocialMediaPosts, socialMediaPostsLoading] = useSupabaseData<SocialMediaPost>(() => SupabaseService.getSocialMediaPosts(), JSON.parse(JSON.stringify(MOCK_DATA.socialMediaPosts)));
  const [promoCodes, setPromoCodes, promoCodesLoading] = useSupabaseData<PromoCode>(() => SupabaseService.getPromoCodes(), JSON.parse(JSON.stringify(MOCK_DATA.promoCodes)));
  const [sops, setSops, sopsLoading] = useSupabaseData<SOP>(() => SupabaseService.getSOPs(), JSON.parse(JSON.stringify(MOCK_DATA.sops)));
  const [packages, setPackages, packagesLoading] = useSupabaseData<Package>(() => SupabaseService.getPackages(), JSON.parse(JSON.stringify(MOCK_DATA.packages)));
  const [addOns, setAddOns, addOnsLoading] = useSupabaseData<AddOn>(() => SupabaseService.getAddOns(), JSON.parse(JSON.stringify(MOCK_DATA.addOns)));

  // Check if any data is still loading
  const isLoading = usersLoading || clientsLoading || projectsLoading || teamMembersLoading || 
                   transactionsLoading || teamProjectPaymentsLoading || teamPaymentRecordsLoading || 
                   pocketsLoading || profileLoading || leadsLoading || rewardLedgerEntriesLoading || 
                   cardsLoading || assetsLoading || contractsLoading || clientFeedbackLoading || 
                   notificationsLoading || socialMediaPostsLoading || promoCodesLoading || 
                   sopsLoading || packagesLoading || addOnsLoading;

    // --- [NEW] MOCK EMAIL SERVICE ---
    const sendEmailNotification = (recipientEmail: string, notification: Notification) => {
        console.log(`
        ========================================
        [SIMULASI EMAIL] Mengirim notifikasi ke: ${recipientEmail}
        ----------------------------------------
        Judul: ${notification.title}
        Pesan: ${notification.message}
        Waktu: ${new Date(notification.timestamp).toLocaleString('id-ID')}
        ========================================
        `);
    };

    // --- [NEW] CENTRALIZED NOTIFICATION HANDLER with Supabase ---
    const addNotification = async (newNotificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        const newNotification: Notification = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            isRead: false,
            ...newNotificationData
        };

        try {
            // Save to Supabase
            const savedNotification = await SupabaseService.createNotification(newNotification);
            setNotifications(prev => [savedNotification, ...prev]);

            if (profile.email) {
                sendEmailNotification(profile.email, savedNotification);
            } else {
                console.warn('[SIMULASI EMAIL] Gagal: Alamat email vendor tidak diatur di Pengaturan Profil.');
            }
        } catch (error) {
            console.error('Error saving notification to Supabase:', error);
            // Fallback to local state if Supabase fails
            setNotifications(prev => [newNotification, ...prev]);
        }
    };

  useEffect(() => {
    const handleHashChange = () => {
        const newRoute = window.location.hash || '#/home';
        setRoute(newRoute);
        if (!isAuthenticated) {
            const isPublicRoute = newRoute.startsWith('#/public') || newRoute.startsWith('#/feedback') || newRoute.startsWith('#/suggestion-form') || newRoute.startsWith('#/revision-form') || newRoute.startsWith('#/portal') || newRoute.startsWith('#/freelancer-portal') || newRoute.startsWith('#/login') || newRoute.startsWith('#/signup') || newRoute === '#/home' || newRoute === '#';
            if (!isPublicRoute) {
                window.location.hash = '#/home';
            }
        } else {
            const isAuthLandingPage = newRoute.startsWith('#/login') || newRoute.startsWith('#/signup') || newRoute === '#/home' || newRoute === '#';
            if (isAuthLandingPage) {
                window.location.hash = '#/dashboard';
            }
        }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  useEffect(() => {
      const path = (route.split('?')[0].split('/')[1] || 'home').toLowerCase();
      const newView = Object.values(ViewType).find(v => 
          v.toLowerCase().replace(/ /g, '-') === path
      );
      if (newView) {
          setActiveView(newView);
      } else if (path === 'team') { // Handle 'Freelancer' mapping to 'team' route
          setActiveView(ViewType.TEAM);
      }
  }, [route]);
  
  useEffect(() => {
        const styleElement = document.getElementById('public-theme-style');
        const isPublicRoute = route.startsWith('#/public') || route.startsWith('#/portal') || route.startsWith('#/freelancer-portal');
        
        document.body.classList.toggle('app-theme', !isPublicRoute);
        document.body.classList.toggle('public-page-body', isPublicRoute);

        if (isPublicRoute) {
            const brandColor = profile.brandColor || '#3b82f6';
            
            if (styleElement) {
                const hoverColor = darkenColor(brandColor, 10);
                const brandHsl = hexToHsl(brandColor);
                styleElement.innerHTML = `
                    :root {
                        --public-accent: ${brandColor};
                        --public-accent-hover: ${hoverColor};
                        --public-accent-hsl: ${brandHsl};
                    }
                `;
            }
        } else if (styleElement) {
            styleElement.innerHTML = '';
        }

    }, [route, profile.brandColor]);

  const showNotification = (message: string, duration: number = 3000) => {
    setNotification(message);
    setTimeout(() => {
      setNotification('');
    }, duration);
  };

  const handleSetProfile = (value: React.SetStateAction<Profile>) => {
    setProfile(value);
  };

  const handleLoginSuccess = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    window.location.hash = '#/dashboard';
  };
  
  const handleLogout = async () => {
    try {
      await SupabaseService.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      window.location.hash = '#/home';
      setNotification('Anda telah keluar dari sistem.');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNavigation = (view: ViewType, action?: NavigationAction, notificationId?: string) => {
        const pathMap: { [key in ViewType]: string } = {
            [ViewType.HOMEPAGE]: 'home',
            [ViewType.DASHBOARD]: 'dashboard',
            [ViewType.PROSPEK]: 'prospek',
            [ViewType.BOOKING]: 'booking',
            [ViewType.CLIENTS]: 'clients',
            [ViewType.PROJECTS]: 'projects',
            [ViewType.TEAM]: 'team',
            [ViewType.FINANCE]: 'finance',
            [ViewType.CALENDAR]: 'calendar',
            [ViewType.SOCIAL_MEDIA_PLANNER]: 'social-media-planner',
            [ViewType.PACKAGES]: 'packages',
            [ViewType.ASSETS]: 'assets',
            [ViewType.CONTRACTS]: 'contracts',
            [ViewType.PROMO_CODES]: 'promo-codes',
            [ViewType.SOP]: 'sop',
            [ViewType.CLIENT_REPORTS]: 'client-reports',
            [ViewType.SETTINGS]: 'settings',
        };

    const newRoute = `#/${pathMap[view] || view.toLowerCase().replace(/ /g, '-')}`;

    window.location.hash = newRoute;

    setActiveView(view);
    setInitialAction(action || null);
    setIsSidebarOpen(false); // Close sidebar on navigation
    setIsSearchOpen(false); // Close search on navigation
    if (notificationId) {
        handleMarkAsRead(notificationId);
    }
  };

  const hasPermission = (view: ViewType) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    if (view === ViewType.DASHBOARD) return true;
    return currentUser.permissions?.includes(view) || false;
  };
  
  const renderView = () => {
    if (!hasPermission(activeView)) {
        return <AccessDenied onBackToDashboard={() => setActiveView(ViewType.DASHBOARD)} />;
    }
    switch (activeView) {
      case ViewType.DASHBOARD:
        return <Dashboard 
          projects={projects} 
          clients={clients} 
          transactions={transactions} 
          teamMembers={teamMembers}
          cards={cards}
          pockets={pockets}
          handleNavigation={handleNavigation}
          leads={leads}
          teamProjectPayments={teamProjectPayments}
          packages={packages}
          assets={assets}
          clientFeedback={clientFeedback}
          contracts={contracts}
          currentUser={currentUser}
          projectStatusConfig={profile.projectStatusConfig}
        />;
      case ViewType.PROSPEK:
        return <Leads
            leads={leads} setLeads={setLeads}
            clients={clients} setClients={setClients}
            projects={projects} setProjects={setProjects}
            packages={packages} addOns={addOns}
            transactions={transactions} setTransactions={setTransactions}
            userProfile={profile} setProfile={handleSetProfile} showNotification={showNotification}
            cards={cards} setCards={setCards}
            pockets={pockets} setPockets={setPockets}
            promoCodes={promoCodes} setPromoCodes={setPromoCodes}
        />;
      case ViewType.BOOKING:
        return <Booking
            leads={leads}
            clients={clients}
            projects={projects}
            setProjects={setProjects}
            packages={packages}
            userProfile={profile}
            setProfile={setProfile}
            handleNavigation={handleNavigation}
            showNotification={showNotification}
        />;
      case ViewType.CLIENTS:
        return <Clients
          clients={clients} setClients={setClients}
          projects={projects} setProjects={setProjects}
          packages={packages} addOns={addOns}
          transactions={transactions} setTransactions={setTransactions}
          userProfile={profile}
          showNotification={showNotification}
          initialAction={initialAction} setInitialAction={setInitialAction}
          cards={cards} setCards={setCards}
          pockets={pockets} setPockets={setPockets}
          contracts={contracts}
          handleNavigation={handleNavigation}
          clientFeedback={clientFeedback}
          promoCodes={promoCodes} setPromoCodes={setPromoCodes}
          onSignInvoice={(pId, sig) => setProjects(prev => prev.map(p => p.id === pId ? { ...p, invoiceSignature: sig } : p))}
          onSignTransaction={(tId, sig) => setTransactions(prev => prev.map(t => t.id === tId ? { ...t, vendorSignature: sig } : t))}
          addNotification={addNotification}
        />;
      case ViewType.PROJECTS:
        return <Projects 
          projects={projects} setProjects={setProjects}
          clients={clients}
          packages={packages}
          teamMembers={teamMembers}
          teamProjectPayments={teamProjectPayments} setTeamProjectPayments={setTeamProjectPayments}
          transactions={transactions} setTransactions={setTransactions}
          initialAction={initialAction} setInitialAction={setInitialAction}
          profile={profile}
          showNotification={showNotification}
          cards={cards}
          setCards={setCards}
        />;
      case ViewType.TEAM:
        return (
          <Freelancers
            teamMembers={teamMembers}
            setTeamMembers={setTeamMembers}
            teamProjectPayments={teamProjectPayments}
            setTeamProjectPayments={setTeamProjectPayments}
            teamPaymentRecords={teamPaymentRecords}
            setTeamPaymentRecords={setTeamPaymentRecords}
            transactions={transactions}
            setTransactions={setTransactions}
            userProfile={profile}
            showNotification={showNotification}
            initialAction={initialAction}
            setInitialAction={setInitialAction}
            projects={projects}
            setProjects={setProjects}
            rewardLedgerEntries={rewardLedgerEntries}
            setRewardLedgerEntries={setRewardLedgerEntries}
            pockets={pockets}
            setPockets={setPockets}
            cards={cards}
            setCards={setCards}
            onSignPaymentRecord={(rId, sig) => setTeamPaymentRecords(prev => prev.map(r => r.id === rId ? { ...r, vendorSignature: sig } : r))}
          />
        );
      case ViewType.FINANCE:
        return <Finance 
          transactions={transactions} setTransactions={setTransactions}
          pockets={pockets} setPockets={setPockets}
          projects={projects}
          profile={profile}
          cards={cards} setCards={setCards}
          teamMembers={teamMembers}
          rewardLedgerEntries={rewardLedgerEntries}
        />;
      case ViewType.PACKAGES:
        return <Packages packages={packages} setPackages={setPackages} addOns={addOns} setAddOns={setAddOns} projects={projects} profile={profile} />;
      case ViewType.ASSETS:
        return <Assets assets={assets} setAssets={setAssets} profile={profile} showNotification={showNotification} />;
      case ViewType.CONTRACTS:
        return <Contracts 
            contracts={contracts} setContracts={setContracts}
            clients={clients} projects={projects} profile={profile}
            showNotification={showNotification}
            initialAction={initialAction} setInitialAction={setInitialAction}
            packages={packages}
            onSignContract={(cId, sig, signer) => setContracts(prev => prev.map(c => c.id === cId ? { ...c, [signer === 'vendor' ? 'vendorSignature' : 'clientSignature']: sig } : c))}
        />;
      case ViewType.SOP:
        return <SOPManagement sops={sops} setSops={setSops} profile={profile} showNotification={showNotification} />;
      case ViewType.SETTINGS:
        return <Settings 
          profile={profile} setProfile={handleSetProfile} 
          transactions={transactions} projects={projects}
          packages={packages}
          users={users}
          setUsers={setUsers}
          currentUser={currentUser}
          showNotification={showNotification}
        />;
      case ViewType.CALENDAR:
        return <CalendarView projects={projects} setProjects={setProjects} teamMembers={teamMembers} profile={profile} />;
      case ViewType.CLIENT_REPORTS:
        return <ClientReports 
            clients={clients}
            leads={leads}
            projects={projects}
            feedback={clientFeedback}
            setFeedback={setClientFeedback}
            showNotification={showNotification}
        />;
      case ViewType.SOCIAL_MEDIA_PLANNER:
        return <SocialPlanner posts={socialMediaPosts} setPosts={setSocialMediaPosts} projects={projects} showNotification={showNotification} />;
      case ViewType.PROMO_CODES:
        return <PromoCodes promoCodes={promoCodes} setPromoCodes={setPromoCodes} projects={projects} showNotification={showNotification} />;
      default:
        return <div />;
    }
  };
  
  // --- ROUTING LOGIC ---
  if (route.startsWith('#/home') || route === '#/') return <Homepage />;
  if (route.startsWith('#/login')) return <Login onLoginSuccess={handleLoginSuccess} />;
  if (route.startsWith('#/signup')) return <Signup />;
  
  if (route.startsWith('#/public-packages')) {
    return <PublicPackages
        packages={packages}
        addOns={addOns}
        userProfile={profile}
        showNotification={showNotification}
        setClients={setClients}
        setProjects={setProjects}
        setTransactions={setTransactions}
        setCards={setCards}
        setLeads={setLeads}
        addNotification={addNotification}
        cards={cards}
        promoCodes={promoCodes}
        setPromoCodes={setPromoCodes}
    />;
  }
  if (route.startsWith('#/public-booking')) {
    const allDataForForm = { clients, projects, teamMembers, transactions, teamProjectPayments, teamPaymentRecords, pockets, profile, leads, rewardLedgerEntries, cards, assets, contracts, clientFeedback, notifications, socialMediaPosts, promoCodes, sops, packages, addOns };
    return <PublicBookingForm {...allDataForForm} userProfile={profile} showNotification={showNotification} setClients={setClients} setProjects={setProjects} setTransactions={setTransactions} setCards={setCards} setPockets={setPockets} setPromoCodes={setPromoCodes} setLeads={setLeads} addNotification={addNotification} />;
  }
  if (route.startsWith('#/public-lead-form')) {
    // FIX: Pass addNotification prop to PublicLeadForm
    return <PublicLeadForm setLeads={setLeads} userProfile={profile} showNotification={showNotification} addNotification={addNotification} />;
  }
  
  if (route.startsWith('#/feedback')) return <PublicFeedbackForm setClientFeedback={setClientFeedback} />;
  if (route.startsWith('#/suggestion-form')) return <SuggestionForm setLeads={setLeads} />;
  if (route.startsWith('#/revision-form')) return <PublicRevisionForm projects={projects} teamMembers={teamMembers} onUpdateRevision={(pId, rId, data) => setProjects(prev => prev.map(p => p.id === pId ? {...p, revisions: p.revisions?.map(r => r.id === rId ? {...r, ...data, completedDate: new Date().toISOString()} : r)} : p))} />;
  if (route.startsWith('#/portal/')) {
    const accessId = route.split('/portal/')[1];
    return <ClientPortal accessId={accessId} clients={clients} projects={projects} setClientFeedback={setClientFeedback} showNotification={showNotification} contracts={contracts} transactions={transactions} userProfile={profile} packages={packages} onClientConfirmation={(pId, stage) => setProjects(prev => prev.map(p => p.id === pId ? {...p, [`is${stage.charAt(0).toUpperCase() + stage.slice(1)}ConfirmedByClient`]: true} : p))} onClientSubStatusConfirmation={(pId, sub, note) => setProjects(prev => prev.map(p => p.id === pId ? {...p, confirmedSubStatuses: [...(p.confirmedSubStatuses || []), sub], clientSubStatusNotes: {...(p.clientSubStatusNotes || {}), [sub]: note}} : p))} onSignContract={(cId, sig, signer) => setContracts(prev => prev.map(c => c.id === cId ? {...c, [signer === 'vendor' ? 'vendorSignature' : 'clientSignature']: sig} : c))} />;
  }
  if (route.startsWith('#/freelancer-portal/')) {
     const accessId = route.split('/freelancer-portal/')[1];
     // FIX: Pass addNotification prop to FreelancerPortal
     return <FreelancerPortal accessId={accessId} teamMembers={teamMembers} projects={projects} teamProjectPayments={teamProjectPayments} teamPaymentRecords={teamPaymentRecords} rewardLedgerEntries={rewardLedgerEntries} showNotification={showNotification} onUpdateRevision={(pId, rId, data) => setProjects(prev => prev.map(p => p.id === pId ? {...p, revisions: p.revisions?.map(r => r.id === rId ? {...r, ...data, completedDate: new Date().toISOString()} : r)} : p))} sops={sops} userProfile={profile} addNotification={addNotification} />;
  }

  if (!isAuthenticated && !authLoading) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="
        flex h-screen 
        bg-brand-bg 
        text-brand-text-primary
        overflow-hidden
    ">
      <Sidebar 
        activeView={activeView} 
        setActiveView={(view) => handleNavigation(view)} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        currentUser={currentUser}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            pageTitle={activeView} 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            setIsSearchOpen={setIsSearchOpen}
            notifications={notifications}
            handleNavigation={handleNavigation}
            handleMarkAllAsRead={handleMarkAllAsRead}
            currentUser={currentUser}
            profile={profile}
            handleLogout={handleLogout}
        />
        
        <main className="
            flex-1 
            overflow-x-hidden 
            overflow-y-auto 
            p-3 sm:p-4 md:p-6 lg:p-8 
            pb-20 xl:pb-8
            overscroll-contain
        " 
        style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(5rem + var(--safe-area-inset-bottom, 0px))'
        }}>
            <div className="animate-fade-in">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
                            <p className="text-brand-text-secondary">Loading data from database...</p>
                        </div>
                    </div>
                ) : (
                    renderView()
                )}
            </div>
        </main>
      </div>
      
      {/* Enhanced Notification Toast */}
      {notification && (
        <div className="
            fixed top-4 right-4 
            sm:top-6 sm:right-6
            bg-brand-accent 
            text-white 
            py-3 px-4 sm:py-4 sm:px-6
            rounded-xl 
            shadow-2xl 
            z-50 
            animate-fade-in-out
            backdrop-blur-sm
            border border-brand-accent-hover/20
            max-w-sm
            break-words
        "
        style={{
            top: 'calc(1rem + var(--safe-area-inset-top, 0px))',
            right: 'calc(1rem + var(--safe-area-inset-right, 0px))'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse-soft" />
            <span className="font-medium text-sm sm:text-base">{notification}</span>
          </div>
        </div>
      )}
      
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        clients={clients}
        projects={projects}
        teamMembers={teamMembers}
        handleNavigation={handleNavigation}
      />
      
      <BottomNavBar activeView={activeView} handleNavigation={handleNavigation} />
    </div>
  );
};

export default App;