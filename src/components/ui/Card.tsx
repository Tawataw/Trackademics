import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("glass-panel rounded-3xl p-6 relative overflow-hidden", className)} {...props} />
));
Card.displayName = 'Card';
