import React from 'react';

const Skeleton = ({
  className = '',
  variant = 'text', // 'text', 'circular', 'rectangular'
  width,
  height,
}) => {
  const baseClass = 'bg-slate-200 animate-pulse';
  
  const variants = {
    text: 'h-4 rounded w-full my-1',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`${baseClass} ${variants[variant]} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;

