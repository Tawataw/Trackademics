import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20',
      secondary: 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white',
      outline: 'border border-white/20 hover:bg-white/10 text-white',
      ghost: 'hover:bg-white/10 text-white/70 hover:text-white',
    };
    
    const sizes = {
      sm: 'px-4 py-1.5 text-sm rounded-full',
      md: 'px-6 py-2 rounded-full',
      lg: 'px-8 py-3 text-lg font-medium rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
