import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Lock, 
  Save, 
  BadgeCheck,
  KeyRound,
  FileCheck,
  Camera
} from 'lucide-react';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setMobileNumber(profile.mobile_number || '');
      
      const localAvatar = localStorage.getItem(`avatar_${profile.id}`);
      const metadataAvatar = user?.user_metadata?.avatar_url;
      setAvatarUrl(localAvatar || metadataAvatar || '');
    }
  }, [profile, user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      setAvatarUrl(base64Data);

      try {
        // 1. Save to Auth Metadata
        const { error: authError } = await supabase.auth.updateUser({
          data: { avatar_url: base64Data }
        });
        if (authError) throw authError;

        // 2. Save to LocalStorage
        localStorage.setItem(`avatar_${profile.id}`, base64Data);

        toast.success('Avatar updated successfully!');
        if (refreshProfile) await refreshProfile();
      } catch (err) {
        toast.error(err.message || 'Failed to update avatar.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !mobileNumber.trim()) {
      toast.error('All profile fields are required.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          mobile_number: mobileNumber.trim()
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in password fields.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center bg-card border border-border rounded-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';

  return (
    <div className="space-y-8 w-full">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-primary" /> Admin Profile
        </h2>
        <p className="text-sm text-muted-foreground">Manage your personal credentials, contact details, and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card View */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="relative group cursor-pointer">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Admin Avatar" 
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-3xl uppercase border-2 border-primary/20">
                  {profile.full_name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="absolute bottom-0 right-0 p-1 bg-green-500 rounded-full border-2 border-card" title="Active Account">
                <BadgeCheck className="h-4.5 w-4.5 text-white" />
              </div>
              
              {/* Image Upload Hover Overlay */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              >
                <Camera className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-semibold">Change Photo</span>
              </label>
              <input 
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            
            <h3 className="mt-4 font-bold text-lg text-foreground truncate max-w-full">
              {profile.full_name}
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 mt-1.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
              {profile.role} Portal
            </span>

            <div className="w-full border-t border-border mt-6 pt-4 space-y-3.5 text-left text-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary/70 flex-shrink-0" />
                <span className="truncate text-foreground font-medium">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary/70 flex-shrink-0" />
                <span className="text-foreground font-medium">{profile.mobile_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary/70 flex-shrink-0" />
                <span className="text-foreground font-medium">Joined {joinDate}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Shield className="h-4 w-4 text-primary/70 flex-shrink-0" />
                <span className="text-green-500 font-bold capitalize">{profile.status} Status</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" /> Administrative Access
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              As an Administrator, you have full write access to manage ward directories, assign property collectors, review registration requests, audit payments, and configure tax rates. Keep your credentials secure.
            </p>
          </div>
        </div>

        {/* Profile Settings Edit Area */}
        <div className="md:col-span-2 space-y-8">
          {/* General Details Form */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground">Update Personal Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Edit your administrative name and contact phone number.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Official Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-xs placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-xs placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 opacity-60">
                  Email Address (Read-only)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-muted-foreground opacity-60" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="block w-full rounded-lg border border-input bg-muted/40 py-2 pl-9 pr-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold shadow-md shadow-primary/10 transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-primary" /> Update Password
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Protect your portal access by setting a new secure password.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-xs placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-xs placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  {updatingPassword ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
