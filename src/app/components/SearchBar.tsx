interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
  placeholder: string;
}

export default function SearchBar({
  value,
  onChange,
  onKeyPress,
  placeholder,
}: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border border-[#E4E7EB] rounded-md text-[#4A4A4A] placeholder-[#B0B0B0] focus:outline-none focus:border-[#1A2753] focus:ring-1 focus:ring-[#1A2753] transition-colors shadow-sm"
        style={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      />
    </div>
  );
}
