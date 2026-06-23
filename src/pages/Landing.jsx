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
  UserCheck,
  Globe,
  Database
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-card/75 border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-foreground block">
                Municipal Corporation
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                Tax assessment system
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={handleDashboardRedirect}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm active:scale-[0.98]"
              >
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm active:scale-[0.98]"
                >
                  Register Property
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32 border-b border-border bg-muted/20">
        {/* Dynamic Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Modern Digitized Tax Administration
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
              Smart Tax Collection <br className="hidden sm:inline" />
              <span className="text-muted-foreground font-medium">
                Made Transparent & Easy
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Welcome to the unified Municipal Corporation Tax Collection platform. A single entry point for citizens to pay taxes, field officers to complete surveys, and admins to manage urban zones.
            </p>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {user ? (
                <button
                  onClick={handleDashboardRedirect}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/95 transition-all shadow-sm active:scale-[0.98]"
                >
                  Access Your Dashboard <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/95 transition-all shadow-sm active:scale-[0.98]"
                  >
                    Get Started (Sign In) <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-card text-foreground border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-all active:scale-[0.98]"
                  >
                    Submit Property Registration
                  </Link>
                </>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 md:pt-16 max-w-4xl mx-auto">
              <div className="p-5 bg-card rounded-xl border border-border text-center shadow-sm">
                <span className="block text-2xl font-bold text-foreground">99.2%</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mt-1">Collection Rate</span>
              </div>
              <div className="p-5 bg-card rounded-xl border border-border text-center shadow-sm">
                <span className="block text-2xl font-bold text-foreground">100K+</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mt-1">Verified Properties</span>
              </div>
              <div className="p-5 bg-card rounded-xl border border-border text-center shadow-sm">
                <span className="block text-2xl font-bold text-foreground">&lt; 2 Mins</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mt-1">Tax Payment Time</span>
              </div>
              <div className="p-5 bg-card rounded-xl border border-border text-center shadow-sm">
                <span className="block text-2xl font-bold text-foreground">100%</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mt-1">Secure Payments</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Role Segmentation Cards */}
      <section className="py-16 md:py-20 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Unified System Portals</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              One login URL connects you to your role-specific dashboard based on your user profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Citizen Panel Card */}
            <div className="bg-muted/30 rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mt-4">Citizen Portal</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Submit property tax registration requests, check annual tax records, pay dues online securely with instant receipt downloads, and transfer property ownership records.
              </p>
              <div className="mt-5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                Online Pay • Receipt Downloads • History
              </div>
            </div>

            {/* Collector Panel Card */}
            <div className="bg-muted/30 rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mt-4">Collector Directory</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Field collectors can review properties assigned to their wards, capture precise on-site GPS coordinates directly via the browser, and upload physical structural property audit surveys.
              </p>
              <div className="mt-5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Geolocation Capture • Audit Forms
              </div>
            </div>

            {/* Admin Panel Card */}
            <div className="bg-muted/30 rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mt-4">Admin Control Room</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Municipal administrators verify collector surveys, assign properties, generate annual tax notices, create administrative ward structures, approve transfers, and print reports.
              </p>
              <div className="mt-5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Ward Setup • Tax Billing • Payments Verification
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features / Highlights */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-background">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Why Choose Our Digitized Tax Platform?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Managing tax collection shouldn't be tedious. Our system optimizes municipal zone audits, bridges the gap between field surveyors and citizens, and ensures transparency.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-xs sm:text-sm">Row Level Security (RLS)</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Your personal data and tax receipts are protected by database-level policies.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-xs sm:text-sm">Automated Sequential Billing</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Automated sequences allocate unique Property IDs and Receipt IDs upon approval.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <History className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-xs sm:text-sm">Detailed Audit Trail Logging</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Every system transfer, approval, and verification logs automatically for review.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mock Dashboard Preview Card */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 text-foreground relative shadow-sm overflow-hidden">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">SYSTEM STATUS</span>
              <h3 className="text-xl md:text-2xl font-bold">Ready for Deployment</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our application database schema is validated, security protocols are active, and configurations for direct Vercel sub-domain redirection are fully operational.
              </p>
              
              <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> API Connected</span>
                <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-primary" /> 15 SQL Tables Loaded</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-muted/30 border-t border-border py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-4.5 w-4.5 text-primary" />
            <span className="font-bold text-xs text-foreground">Municipal Corporation Tax Assessment Platform</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            © 2026 Tax Collection & Assessment Management System. All rights reserved.
          </p>
          <p className="text-[10px] text-muted-foreground">
            Designed & Developed by <span className="font-semibold text-foreground">NKtech IT Solution</span>
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
