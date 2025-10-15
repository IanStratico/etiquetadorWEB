interface PieceCardProps {
  id: string;
  article: string;
  color: string;
  measure: string;
  onDelete: () => void;
  onPrint: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

export default function PieceCard({
  id,
  article,
  color,
  measure,
  onDelete,
  onPrint,
  isSelected = false,
  isDisabled = false,
}: PieceCardProps) {
  return (
    <div
      className={`
        relative bg-white rounded-lg p-4 mb-3 transition-all duration-200 cursor-pointer
        ${isDisabled ? "opacity-50" : "hover:border-[#C19E5A]"}
        ${
          isSelected
            ? "bg-[#EAF0F8] border-[#C19E5A]"
            : "border border-transparent"
        }
      `}
      style={{
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Print Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrint();
          }}
          className="text-[#1A2753] hover:text-[#C19E5A] transition-colors"
          disabled={isDisabled}
          title="Imprimir etiqueta"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6,9 6,2 18,2 18,9"></polyline>
            <path d="M6,18H4a2,2 0 0,1 -2,-2V11a2,2 0 0,1 2,-2H20a2,2 0 0,1 2,2v5a2,2 0 0,1 -2,2H18"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-[#1A2753] hover:text-red-600 transition-colors"
          disabled={isDisabled}
          title="Eliminar pieza"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>

      {/* Piece ID */}
      <div className="text-[#1A2753] text-base font-bold mb-2">{id}</div>

      {/* Piece Details */}
      <div className="space-y-1">
        <div className="text-[#4A4A4A] text-sm">{article}</div>
        <div className="text-[#4A4A4A] text-sm">{color}</div>
        <div className="text-[#4A4A4A] text-sm">{measure}</div>
      </div>
    </div>
  );
}
