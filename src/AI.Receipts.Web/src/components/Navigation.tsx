import React from 'react';
import { Upload, Receipt } from 'lucide-react';

interface NavigationProps {
  currentPage: 'scanner' | 'receipts';
  onPageChange: (page: 'scanner' | 'receipts') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    {
      id: 'scanner' as const,
      label: 'Receipt Scanner',
      icon: Upload,
      description: 'Upload and scan receipts'
    },
    {
      id: 'receipts' as const,
      label: 'Receipts',
      icon: Receipt,
      description: 'View all receipts'
    }
  ];

  return (
    <nav className="flex items-center gap-2" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPageChange(item.id)}
            className={`
              inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20
              ${isActive
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
              }
            `}
            aria-current={isActive ? 'page' : undefined}
            title={item.description}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;