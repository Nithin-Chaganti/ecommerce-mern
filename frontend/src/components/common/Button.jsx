
import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-100 hover:shadow-md hover:shadow-indigo-200',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-400 hover:border-slate-300 shadow-sm',
    accent: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400 shadow-sm shadow-emerald-100 hover:shadow-md hover:shadow-emerald-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm shadow-rose-100 hover:shadow-md hover:shadow-rose-200',
    outline: 'border-2 border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50 focus:ring-indigo-500',
    outlineWhite: 'border border-slate-700 text-slate-200 bg-transparent hover:bg-slate-800 hover:text-white hover:border-slate-600 focus:ring-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
  };

  const sizes = {
    sm: 'text-xs py-1.5 px-3 gap-1.5',
    md: 'text-sm py-2.5 px-5 gap-2',
    lg: 'text-base py-3 px-6 gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} className="shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
