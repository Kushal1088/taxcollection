import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { 
  Building2, 
  ClipboardCheck, 
  MapPin, 
  UserCheck, 
  ShieldAlert, 
  LogOut, 
  RefreshCw,
  Clock
} from 'lucide-react';

const PendingReview = () => {
  const { user, profile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [collector, setCollector] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRequestDetails = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get the citizen request associated with this user
      const { data: reqs } = await supabase
        .from('citizen_requests')
        .select('*')
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false });

      if (reqs && reqs.length > 0) {
        const currentReq = reqs[0];
        setRequest(currentReq);

        // If a collector is assigned, load collector info
        if (currentReq.collector_id) {
          const { data: coll } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentReq.collector_id)
            .single();
          if (coll) setCollector(coll);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [user]);

  const handleRefresh = async () => {
    await refreshProfile();
    await fetchRequestDetails();
    toast.success('Status updated!');
  };

  useEffect(() => {
    // If the profile becomes active, redirect to citizen dashboard automatically
    if (profile?.status === 'active') {
      navigate('/citizen');
    }
  }, [profile, navigate]);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  // Determine current steps
  const getStepStatus = (stepIndex) => {
    if (!request) return 'pending';
    const status = request.status;

    if (status === 'rejected') {
      if (stepIndex === 1) return 'completed';
      if (stepIndex === 2) return 'failed';
      return 'pending';
    }

    switch (status) {
      case 'pending_admin_review':
        if (stepIndex === 1) return 'completed';
        if (stepIndex === 2) return 'active';
        return 'pending';
      case 'assigned_to_collector':
        if (stepIndex <= 2) return 'completed';
        if (stepIndex === 3) return 'active';
        return 'pending';
      case 'verification_completed':
        if (stepIndex <= 3) return 'completed';
        if (stepIndex === 4) return 'active';
        return 'pending';
      case 'approved':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const steps = [
    { title: 'Submit Registration', desc: 'Account request received by municipality.', icon: ClipboardCheck },
    { title: 'Admin Review & Assignment', desc: 'Admin reviews credentials & assigns local ward collector.', icon: UserCheck },
    { title: 'Physical Field Survey', desc: 'Collector visits property to capture GPS, photos & measurements.', icon: MapPin },
    { title: 'Final Activation', desc: 'Admin reviews collector survey report to activate property and account.', icon: ClipboardCheck }
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center border-b border-border pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Building2 className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground text-center">Account Under Verification</h2>
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mt-1">Application Track ID: {request?.id || 'PENDING'}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Refreshing status details...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rejection Alert */}
            {request?.status === 'rejected' && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex gap-3 text-sm">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Application Rejected by Admin</p>
                  <p className="opacity-90">Reason: {request.rejection_reason || 'No reason provided.'}</p>
                  <p className="text-xs pt-1 opacity-75">Please contact the municipal helpdesk or submit a new registration.</p>
                </div>
              </div>
            )}

            {/* Stepper Timeline */}
            <div className="relative pl-6 border-l border-muted space-y-8 py-2 ml-4">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const status = getStepStatus(stepNum);
                const Icon = step.icon;

                let badgeBg = 'bg-muted text-muted-foreground border-muted-foreground/20';
                let lineBg = 'bg-muted';
                
                if (status === 'completed') {
                  badgeBg = 'bg-primary text-primary-foreground border-primary';
                  lineBg = 'bg-primary';
                } else if (status === 'active') {
                  badgeBg = 'bg-primary/20 text-primary border-primary animate-pulse';
                } else if (status === 'failed') {
                  badgeBg = 'bg-destructive text-destructive-foreground border-destructive';
                }

                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Bullet circle badge */}
                    <div className={`absolute -left-[37px] flex h-7.5 w-7.5 items-center justify-center rounded-full border bg-card text-xs font-bold transition-all shadow-sm ${badgeBg}`}>
                      {status === 'completed' ? '✓' : status === 'failed' ? '✗' : stepNum}
                    </div>

                    {/* Step details */}
                    <div className="space-y-1 flex-1">
                      <h4 className={`text-sm font-semibold leading-none ${status === 'active' ? 'text-primary' : status === 'failed' ? 'text-destructive' : 'text-foreground'}`}>
                        {step.title}
                        {status === 'active' && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest">
                            <Clock className="h-3 w-3 animate-spin" /> In Progress
                          </span>
                        )}
                        {status === 'failed' && (
                          <span className="ml-2 text-[10px] font-bold text-destructive uppercase tracking-widest">
                            Rejected
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-normal">{step.desc}</p>
                      
                      {/* Context details if active steps match assignments */}
                      {stepNum === 2 && request?.collector_id && collector && (
                        <div className="mt-2 text-xs p-3 rounded-lg bg-muted/40 border border-border max-w-sm">
                          <span className="font-semibold text-foreground block">Assigned Collector:</span>
                          <span className="text-muted-foreground block">{collector.full_name}</span>
                          <span className="text-muted-foreground block">Contact: {collector.mobile_number}</span>
                        </div>
                      )}

                      {stepNum === 3 && request?.status === 'verification_completed' && (
                        <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          ✓ Property surveyed physically. Waiting for final admin review.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Buttons footer */}
            <div className="flex gap-4 pt-4 border-t border-border">
              <button
                onClick={handleRefresh}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-input bg-card hover:bg-muted py-2.5 text-sm font-semibold text-foreground transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 py-2.5 text-sm font-semibold transition-all"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingReview;
