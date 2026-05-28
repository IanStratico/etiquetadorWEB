interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
  placeholder: string;
  onCameraClick?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  onKeyPress,
  placeholder,
  onCameraClick,
}: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        className={`w-full min-h-[48px] py-3 bg-white border border-[#E4E7EB] rounded-md text-base text-[#4A4A4A] placeholder-[#B0B0B0] focus:outline-none focus:border-[#1A2753] focus:ring-1 focus:ring-[#1A2753] transition-colors shadow-sm ${onCameraClick ? "pl-4 pr-14" : "px-4"}`}
        style={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      />
      {onCameraClick && (
        <button
          type="button"
          onClick={onCameraClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md text-[#1A2753] transition-colors hover:bg-gray-100"
          aria-label="Escanear con cámara"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      )}
    </div>
  );
}
