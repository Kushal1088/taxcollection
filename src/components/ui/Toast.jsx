import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

// Global toast trigger utility
export const toast = {
  success: (msg) => triggerToast(msg, 'success'),
  error: (msg) => triggerToast(msg, 'error'),
  info: (msg) => triggerToast(msg, 'info'),
  warning: (msg) => triggerToast(msg, 'warning'),
};

const triggerToast = (message, type) => {
  const event = new CustomEvent('app-toast', { detail: { message, type, id: Math.random().toString() } });
  window.dispatchEvent(event);
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type, id } = e.detail;
      setToasts(prev => [...prev, { message, type, id }]);
      
      // Auto-remove toast after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => {
        let bg = 'bg-card text-foreground border-border';
        let Icon = Info;
        let iconColor = 'text-blue-500';

        if (t.type === 'success') {
          bg = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800/30';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500';
        } else if (t.type === 'error') {
          bg = 'bg-destructive/10 text-destructive border-destructive/20';
          Icon = AlertCircle;
          iconColor = 'text-destructive';
        } else if (t.type === 'warning') {
          bg = 'bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800/30';
          Icon = AlertCircle;
          iconColor = 'text-amber-500';
        }

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg glass pointer-events-auto animate-in slide-in-from-top-4 duration-300 ${bg}`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium pr-2">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
