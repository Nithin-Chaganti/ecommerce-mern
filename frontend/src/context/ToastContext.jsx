
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgColor = 'bg-white';
          let textColor = 'text-slate-800';
          let Icon = Info;
          let iconColor = 'text-blue-500';

          switch (toast.type) {
            case 'success':
              bgColor = 'bg-white border-l-4 border-emerald-500';
              iconColor = 'text-emerald-500';
              Icon = CheckCircle;
              break;
            case 'error':
              bgColor = 'bg-white border-l-4 border-rose-500';
              iconColor = 'text-rose-500';
              Icon = AlertCircle;
              break;
            case 'warning':
              bgColor = 'bg-white border-l-4 border-amber-500';
              iconColor = 'text-amber-500';
              Icon = AlertTriangle;
              break;
            default:
              bgColor = 'bg-white border-l-4 border-indigo-500';
              iconColor = 'text-indigo-500';
              Icon = Info;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border border-slate-100 ${bgColor} ${textColor} animate-slide-up transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
              role="alert"
            >
              <div className={`mt-0.5 ${iconColor} shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 text-sm font-medium pr-2">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
