import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import { User, Phone, Mail, CreditCard, Save } from 'lucide-react';

const Profile = () => {
  const { profile, refreshProfile } = useAuth();
  const [mobile, setMobile] = useState(profile?.mobile_number || '');
  const [submitting, setSubmitting] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!mobile.trim()) {
      toast.error('Mobile number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ mobile_number: mobile.trim() })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile details updated successfully.');
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h2>
        <p className="text-sm text-muted-foreground">View and manage your personal details and municipal contacts.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg uppercase">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">{profile?.full_name}</h3>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Registered Citizen</span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email (Read Only) */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-muted/30 rounded-lg outline-none cursor-not-allowed text-muted-foreground"
                />
              </div>
            </div>

            {/* Aadhaar Number (Read Only) */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Aadhaar Reference
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  disabled
                  value="••••-••••-•••• (Verified)"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-muted/30 rounded-lg outline-none cursor-not-allowed text-muted-foreground font-semibold"
                />
              </div>
            </div>

            {/* Mobile Number (Editable) */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="Update phone contact"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-semibold shadow-md shadow-primary/10 transition-colors"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Saving...' : 'Update Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
