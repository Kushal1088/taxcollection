import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  DollarSign, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  UserCheck,
  Building2,
  MapPin,
  Map,
  ClipboardList,
  Plus,
  Settings
} from 'lucide-react';

const Layout = ({ children }) => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load notifications
  useEffect(() => {
    if (!profile) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (data) setNotifications(data);
    };
    fetchNotifications();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [profile]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const markNotificationAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define sidebar links based on role
  const getLinks = () => {
    switch (profile?.role) {
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'User Management', icon: Users },
          { to: '/admin/requests', label: 'Citizen Requests', icon: FileText },
          { to: '/admin/collectors', label: 'Collector Management', icon: UserCheck },
          { to: '/admin/collectors?tab=wards', label: 'Ward Management', icon: Map },
          { to: '/admin/verifications', label: 'Property Verification', icon: CheckSquare },
          { to: '/admin/properties', label: 'Property Management', icon: Building2 },
          { to: '/admin/taxes', label: 'Tax Management', icon: DollarSign },
          { to: '/admin/notices', label: 'Tax Notices', icon: Bell },
          { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
          { to: '/admin/settings', label: 'Settings', icon: Settings },
          { to: '/admin/profile', label: 'Profile', icon: User },
        ];
      case 'collector':
        return [
          { to: '/collector', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/collector/assigned', label: 'Assigned Properties', icon: ClipboardList },
          { to: '/collector/assigned', label: 'Survey Forms', icon: FileText },
          { to: '/collector/completed', label: 'Completed Surveys', icon: CheckSquare },
        ];
      case 'citizen':
        return [
          { to: '/citizen', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/citizen', label: 'My Properties', icon: Building2 },
          { to: '/citizen/bills', label: 'Tax Bills', icon: DollarSign },
          { to: '/citizen/bills', label: 'Payment History', icon: FileText },
          { to: '/citizen', label: 'Notices', icon: Bell },
          { to: '/citizen/profile', label: 'Profile', icon: User },
        ];
      default:
        return [];
    }
  };

  const menuLinks = getLinks();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              Municipal Corporation
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar User Profile Info */}
        <Link 
          to={profile?.role === 'admin' ? '/admin/profile' : profile?.role === 'citizen' ? '/citizen/profile' : '#'}
          className="p-6 border-b border-border bg-muted/30 hover:bg-muted/50 block transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg uppercase">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{profile?.full_name}</p>
              <p className="truncate text-xs text-muted-foreground capitalize font-medium">{profile?.role}</p>
            </div>
          </div>
        </Link>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.to.includes('?')
              ? (location.pathname + location.search) === link.to
              : location.pathname === link.to && !location.search.includes('tab=wards');
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Log out */}
        <div className="p-4 border-t border-border bg-muted/10 space-y-3">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            Sign Out
          </button>
          <div className="text-center text-[10px] text-muted-foreground border-t border-border/50 pt-2">
            <p className="font-semibold text-foreground/75">© 2026 Kushal Pandey</p>
            <p className="mt-0.5 opacity-80">Tax Collection Management</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-6 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-foreground hidden sm:block">
              Tax Collection Management System
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-xl p-2 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                    <div className="flex items-center justify-between border-b border-border p-2 mb-1">
                      <span className="text-sm font-semibold">Notifications</span>
                      {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No notifications yet.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => !notif.is_read && markNotificationAsRead(notif.id)}
                            className={`p-2.5 rounded-md text-left transition-colors cursor-pointer text-xs ${
                              notif.is_read ? 'hover:bg-muted/50 opacity-70' : 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary font-medium'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="font-semibold text-foreground">{notif.title}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick User Avatar Badge */}
            <Link 
              to={profile?.role === 'admin' ? '/admin/profile' : profile?.role === 'citizen' ? '/citizen/profile' : '#'}
              className="hidden items-center gap-2 sm:flex pl-2 border-l border-border hover:opacity-80 transition-opacity"
            >
              <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary text-secondary-foreground uppercase tracking-wide cursor-pointer">
                {profile?.role}
              </span>
            </Link>
          </div>
        </header>

        {/* Content Router Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
