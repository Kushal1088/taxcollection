import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from '../components/ui/Toast';
import { Building2, Mail, ArrowLeft, Key } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }
    setLoading(true);
    
    // Simulate reset request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Password recovery instructions sent to your email.');
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-xl space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold text-foreground">
            Password Recovery
          </h2>
          <p className="mt-1 text-center text-xs font-semibold text-primary uppercase tracking-wide">
            Reset Municipal Account Credentials
          </p>
        </div>

        {!submitted ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Your Registered Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 bg-muted/20 p-4 rounded-lg border border-border">
            <Key className="h-8 w-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-medium text-foreground">
              Recovery Link Sent!
            </p>
            <p className="text-xs text-muted-foreground">
              Check your inbox at <span className="font-semibold text-foreground">{email}</span> for a link to reset your password.
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
