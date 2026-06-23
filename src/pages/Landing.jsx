import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, 
  ShieldCheck, 
  MapPin, 
  History, 
  FileText, 
  Users, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  BookOpen,
  UserCheck
} from 'lucide-react';

const Landing = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    if (!profile) return;
    if (profile.role === 'admin') {
      const adminUrl = import.meta.env.VITE_ADMIN_PORTAL_URL || 'http://localhost:5174/';
      window.location.href = adminUrl;
    } else if (profile.role === 'collector') {
      navigate('/collector');
    } else {
      navigate('/citizen');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
              <Building2 className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-indigo-400">
                ULB Municipal
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                Tax Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
            >
              Register Property
            </Link>
            {user && (
              <button
                onClick={handleDashboardRedirect}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
              >
                Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Dynamic Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
              <Sparkles className="h-3 w-3" /> Modern Digitized Tax Administration
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              Smart Tax Collection <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:to-violet-400">
                Made Transparent & Easy
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
              Welcome to the unified Municipal Corporation Tax Collection platform. A single entry point for citizens to pay taxes, field officers to complete surveys, and admins to manage urban zones.
            </p>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all active:scale-[0.98]"
              >
                Get Started (Sign In) <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold transition-all"
              >
                Submit Property Registration
              </Link>
              {user && (
                <button
                  onClick={handleDashboardRedirect}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                >
                  Access Dashboard
                </button>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-12 md:pt-16 max-w-5xl mx-auto">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center shadow-sm">
                <span className="block text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">99.2%</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-1">Collection Rate</span>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center shadow-sm">
                <span className="block text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">100K+</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-1">Verified Properties</span>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center shadow-sm">
                <span className="block text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">&lt; 2 Mins</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-1">Tax Payment Time</span>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center shadow-sm">
                <span className="block text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">100%</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-1">Secure Payments</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Role Segmentation Cards */}
      <section className="py-16 bg-white/50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Unified System Portals</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              One login URL connects you to your role-specific dashboard based on your user profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Citizen Panel Card */}
            <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-5">Citizen Portal</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Submit property tax registration requests, check annual tax records, pay dues online securely with instant receipt downloads, and transfer property ownership records.
              </p>
              <div className="flex items-center gap-1 mt-6 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Features: Online Pay, Receipt Downloads, History
              </div>
            </div>

            {/* Collector Panel Card */}
            <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-5">Collector Directory</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Field collectors can review properties assigned to their wards, capture precise on-site GPS coordinates directly via the browser, and upload physical structural property audit surveys.
              </p>
              <div className="flex items-center gap-1 mt-6 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Features: Geolocation capture, Property Audit forms
              </div>
            </div>

            {/* Admin Panel Card */}
            <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-5">Admin Control Room</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Municipal administrators verify collector surveys, assign properties, generate annual tax notices, create administrative ward structures, approve transfers, and print reports.
              </p>
              <div className="flex items-center gap-1 mt-6 text-xs font-bold text-violet-600 dark:text-violet-400">
                Features: Ward Setup, Tax Generation, Payments Approval
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features / Highlights */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Why Choose Our Digitized Tax Platform?
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Managing tax collection shouldn't be tedious. Our system optimizes municipal zone audits, bridges the gap between field surveyors and citizens, and ensures transparency.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-3 w-3" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Row Level Security (RLS)</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your personal data and tax receipts are protected by database-level policies.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="h-3 w-3" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Automated Sequential Billing</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated sequences allocate unique Property IDs and Receipt IDs upon approval.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                  <History className="h-3 w-3" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Detailed Audit Trail Logging</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Every system transfer, approval, and verification logs automatically for review.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mock Dashboard Preview Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-6 md:p-8 text-white relative shadow-xl overflow-hidden">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-200 block">SYSTEM STATUS</span>
              <h3 className="text-2xl md:text-3xl font-black">Ready for Deployment</h3>
              <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                Our application database schema is validated, security protocols are active, and configurations for direct Vercel sub-domain redirection are fully operational.
              </p>
              
              <div className="pt-4 border-t border-indigo-400 flex items-center justify-between text-xs text-indigo-100">
                <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> API Connected</span>
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> 15 SQL Tables Loaded</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-extrabold text-sm text-slate-800 dark:text-white">Municipal Corporation Zone A Portal</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © 2026 Tax Collection & Assessment Management System. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Designed & Developed by <span className="font-semibold text-slate-600 dark:text-slate-400">Kushal Pandey</span>
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
