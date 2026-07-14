import React from 'react';

const Input = ({
  label,
  type = 'text',
  error = '',
  id,
  className = '',
  textarea = false,
  rows = 4,
  ...props
}) => {
  const inputStyles = `
    w-full px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm focus:outline-none focus:ring-2
    ${
      error
        ? 'border-rose-400 bg-rose-50/10 text-rose-900 placeholder-rose-300 focus:ring-rose-200 focus:border-rose-500'
        : 'border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300'
    }
    disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
  `;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 select-none">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          id={id}
          rows={rows}
          className={inputStyles}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={inputStyles}
          {...props}
        />
      )}
      {error && (
        <span className="text-xs font-medium text-rose-500 mt-0.5 select-none animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;

