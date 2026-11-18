import { useMemo } from 'react';

export const usePasswordAge = (passwordLastChangedDate?: string) => {
  return useMemo(() => {
    if (!passwordLastChangedDate) return { text: 'Last changed 3 months ago', days: 90 }; // Default
    const lastChanged = new Date(passwordLastChangedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastChanged.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let text = '';
    if (diffDays < 30) text = `Last changed ${diffDays} days ago`;
    else {
        const months = Math.floor(diffDays / 30);
        text = `Last changed ${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    return { text, days: diffDays };
  }, [passwordLastChangedDate]);
};
