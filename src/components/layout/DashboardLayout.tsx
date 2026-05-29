import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isDemoMode } from '../../lib/supabaseClient';
import { 
  LayoutDashboard, Wrench, MessageSquare, 
  User, CreditCard, LogOut, Menu, X, Bell, PlusCircle, 
  ShieldCheck, AlertTriangle, List, Shield, HardHat
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
      } catch (e) {
        console.error('Error fetching notifications:', e);
      }
    };

    fetchNotifications();

    // Subscribe to notification updates (realtime channel)
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        setNotifications((prev) => [payload.new, ...prev]);
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  // Compile role specific menu items
  const clientItems: SidebarItem[] = [
    { name: 'Overview', path: '/client', icon: LayoutDashboard },
    { name: 'Post a Job', path: '/client/post-job', icon: PlusCircle },
    { name: 'My Jobs', path: '/client/my-jobs', icon: Wrench },
    { name: 'Messages', path: '/client/messages', icon: MessageSquare },
    { name: 'Profile', path: '/client/profile', icon: User },
  ];

  const tradieItems: SidebarItem[] = [
    { name: 'Overview', path: '/tradie', icon: LayoutDashboard },
    { name: 'Available Jobs', path: '/tradie/available-jobs', icon: HardHat },
    { name: 'My Jobs', path: '/tradie/my-jobs', icon: Wrench },
    { name: 'Messages', path: '/tradie/messages', icon: MessageSquare },
    { name: 'Verification Docs', path: '/tradie/documents', icon: ShieldCheck },
    { name: 'Subscription', path: '/tradie/subscription', icon: CreditCard },
    { name: 'Profile', path: '/tradie/profile', icon: User },
  ];

  const adminItems: SidebarItem[] = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Verifications', path: '/admin/verifications', icon: ShieldCheck },
    { name: 'User Management', path: '/admin/users', icon: User },
    { name: 'Job Board', path: '/admin/jobs', icon: Wrench },
    { name: 'Disputes Panel', path: '/admin/disputes', icon: AlertTriangle },
    { name: 'Category Editor', path: '/admin/categories', icon: List },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Shield },
  ];

  const sidebarItems = 
    user.role === 'client' ? clientItems : 
    user.role === 'tradie' ? tradieItems : adminItems;

  const roleNameDisplay = 
    user.role === 'client' ? 'Client Dashboard' :
    user.role === 'tradie' ? 'Tradie Panel' :
    user.role === 'super_admin' ? 'Super Admin Office' : 'Admin Console';

  // Demo Switch helper: allows reviewer to switch roles easily
  const switchDemoRole = async (targetRole: 'client' | 'tradie' | 'admin' | 'super_admin') => {
    if (!isDemoMode) return;
    const targetEmail = 
      targetRole === 'client' ? 'client@tradeconnect.com.au' :
      targetRole === 'tradie' ? 'tradie@tradeconnect.com.au' :
      targetRole === 'admin' ? 'admin@tradeconnect.com.au' : 'superadmin@tradeconnect.com.au';
    
    // Perform manual mockdb login
    localStorage.setItem('tc_current_user', JSON.stringify(
      JSON.parse(localStorage.getItem('tc_profiles') || '[]').find((p: any) => p.email === targetEmail)
    ));
    window.location.href = targetRole === 'client' ? '/client' : targetRole === 'tradie' ? '/tradie' : '/admin';
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row text-zinc-100">
      
      {/* 1. SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-2">
          <Wrench className="w-7 h-7 text-orange-500" />
          <span className="font-extrabold text-xl tracking-tight text-white">
            Trade<span className="text-orange-500">Connect</span>
          </span>
        </div>

        {/* Profile Card */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <img 
            src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
            alt={user.full_name} 
            className="w-10 h-10 rounded-full border border-zinc-700 object-cover"
          />
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm text-zinc-200 truncate">{user.full_name}</h4>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {user.role}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION */}
      <header className="md:hidden bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-orange-500" />
          <span className="font-extrabold text-lg tracking-tight text-white">TradeConnect</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile Notifications Trigger */}
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-100 relative"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-orange-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-zinc-950/90 backdrop-blur-sm pt-16">
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex flex-col space-y-2">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <img 
                src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                alt={user.full_name} 
                className="w-10 h-10 rounded-full border border-zinc-700"
              />
              <div>
                <h4 className="font-semibold text-zinc-200">{user.full_name}</h4>
                <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">{user.role}</span>
              </div>
            </div>
            <nav className="space-y-1 py-4">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-orange-600 text-white' 
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={signOut}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all mt-4"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top bar (for Desktop) */}
        <header className="hidden md:flex bg-zinc-900 border-b border-zinc-800 h-16 shrink-0 items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">{roleNameDisplay}</h1>
            {isDemoMode && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Sandbox Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            
            {/* Quick switcher (demo mode only) */}
            {isDemoMode && (
              <div className="flex items-center gap-1.5 bg-zinc-800/50 border border-zinc-700/50 p-1 rounded-lg">
                <span className="text-[10px] text-zinc-400 font-bold px-2 uppercase">Switch:</span>
                <button 
                  onClick={() => switchDemoRole('client')}
                  className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${user.role === 'client' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Client
                </button>
                <button 
                  onClick={() => switchDemoRole('tradie')}
                  className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${user.role === 'tradie' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Tradie
                </button>
                <button 
                  onClick={() => switchDemoRole('admin')}
                  className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${user.role === 'admin' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Admin
                </button>
              </div>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                    <span className="font-bold text-sm text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 text-xs transition-colors ${!n.is_read ? 'bg-orange-500/5' : 'hover:bg-zinc-800/40'}`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-semibold text-zinc-200">{n.title}</span>
                            {!n.is_read && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-zinc-400 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-zinc-500 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick action: Post job button for clients */}
            {user.role === 'client' && (
              <Link 
                to="/client/post-job" 
                className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg shadow-orange-600/15 transition-all card-lift"
              >
                <PlusCircle className="w-4 h-4" />
                Post Job
              </Link>
            )}

            {/* Back to landing */}
            <Link 
              to="/" 
              className="text-xs text-zinc-400 hover:text-zinc-200 font-semibold flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700/50"
            >
              Public Website
            </Link>
          </div>
        </header>

        {/* Global Demo Warning Banner */}
        {isDemoMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-2 text-xs flex items-center justify-between text-amber-400 font-semibold leading-none shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Demo Sandbox Mode active. All listings, messages, and accounts are stored locally in your browser storage.</span>
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="underline text-[10px] uppercase font-bold hover:text-amber-300 cursor-pointer"
            >
              Reset Database
            </button>
          </div>
        )}

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-950">
          {children}
        </main>
      </div>

    </div>
  );
};
export default DashboardLayout;
