import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/Toast';
import { Building2, User, Phone, Mail, MapPin, CreditCard, Lock, ArrowRight } from 'lucide-react';

const Register = () => {
  const { registerCitizen } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, mobileNumber, email, password, confirmPassword } = formData;

    if (!fullName || !mobileNumber || !email || !password) {
      toast.error('All fields are mandatory.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    // Phone validation
    const phoneClean = mobileNumber.replace(/[-\s()]/g, '');
    if (phoneClean.length !== 10 || isNaN(phoneClean)) {
      toast.error('Mobile number must be a valid 10-digit number.');
      return;
    }

    setLoading(true);
    const { data, error } = await registerCitizen(email, password, {
      fullName,
      mobileNumber,
      address: '',
      aadhaarNumber: ''
    });

    if (error) {
      console.error('[Register] Citizen registration submission failed:', error);
      toast.error(error.message || 'Registration failed.');
      setLoading(false);
    } else {
      console.log('[Register] Citizen registration submission succeeded!');
      toast.success('Registration successful! Welcome to your dashboard.');
      navigate('/citizen');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-6 bg-card p-8 rounded-xl border border-border shadow-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold text-foreground">
            Citizen Registration
          </h2>
          <p className="mt-1 text-center text-xs font-semibold text-primary uppercase tracking-wide">
            Municipal Corporation Tax Account Setup
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="e.g. NKtech IT Solution"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  name="mobileNumber"
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary mt-6 px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                Register & Submit Request
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-2 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
