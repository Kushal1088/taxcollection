import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/Toast';
import { Building2, Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const { data, error } = await login(email, password);

    if (error) {
      toast.error(error.message || 'Login failed. Please check credentials.');
      setLoading(false);
    } else {
      toast.success('Successfully logged in!');
      // Route user according to role
      const role = data.profile?.role || (data.user.role !== 'authenticated' ? data.user.role : null) || (email.includes('admin') ? 'admin' : email.includes('collector') ? 'collector' : 'citizen');
      
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'collector') {
        window.location.href = 'http://localhost:5173/collector';
      } else {
        window.location.href = 'http://localhost:5173/citizen';
      }
    }
  };



  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
            Municipal Corporation
          </h2>
          <p className="mt-2 text-center text-sm font-semibold tracking-wide text-primary uppercase">
            Tax Collection Portal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Citizen without an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Submit Registration
            </Link>
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground/60 pt-4 border-t border-border/40">
          <p>© 2026 Tax Collection System</p>
          <p className="mt-0.5">Designed & Developed by <span className="font-semibold text-foreground/75">NKtech IT Solution</span></p>
        </div>

      </div>
    </div>
  );
};

export default Login;
