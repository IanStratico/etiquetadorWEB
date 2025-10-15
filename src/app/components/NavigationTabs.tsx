interface NavigationTabsProps {
  activeTab: 'CLADD' | 'IMPORTADO';
  onTabChange: (tab: 'CLADD' | 'IMPORTADO') => void;
}

export default function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  return (
    <nav className="flex justify-center mb-6">
      <div className="flex border-b border-[#E4E7EB]">
        <button
          onClick={() => onTabChange('CLADD')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'CLADD'
              ? 'text-[#1A2753]'
              : 'text-[#4A4A4A] hover:text-[#1A2753]'
          }`}
        >
          CLADD
          {activeTab === 'CLADD' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C19E5A]"></div>
          )}
        </button>
        <button
          onClick={() => onTabChange('IMPORTADO')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'IMPORTADO'
              ? 'text-[#1A2753]'
              : 'text-[#4A4A4A] hover:text-[#1A2753]'
          }`}
        >
          IMPORTADO
          {activeTab === 'IMPORTADO' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C19E5A]"></div>
          )}
        </button>
      </div>
    </nav>
  );
}
