import React from 'react';
import { cn } from '../lib/utils';
import { Zap } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true }) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex items-center justify-center bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
        <Zap className="w-6 h-6 text-white fill-white" />
      </div>
      {showText && (
        <span className="text-2xl font-display font-bold tracking-tighter text-white">
          ENER<span className="text-primary">GOALS</span>
        </span>
      )}
    </div>
  );
};
