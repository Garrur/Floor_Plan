'use client';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className = '' }: LoadingSpinnerProps) {
  const px = `${size}px`;
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="border border-[var(--c-accent)] animate-spin"
        style={{ 
          width: px, 
          height: px,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          animationDuration: '0.8s',
        }}
      />
    </div>
  );
}
