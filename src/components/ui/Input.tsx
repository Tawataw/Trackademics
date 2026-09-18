import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:bg-white/10 transition-all",
            error && "border-pink-500 focus:border-pink-500 focus:ring-pink-500",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
