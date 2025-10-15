export default function Header() {
  return (
    <header className="text-center py-8">
      <div className="relative inline-block">
        <h1 className="text-[#1A2753] text-3xl font-bold font-serif">
          La Nueva Textil
        </h1>
        {/* Golden curved line over "Nueva Textil" */}
        <div className="absolute -top-2 left-0 w-full h-1">
          <svg
            width="100%"
            height="4"
            viewBox="0 0 200 4"
            className="overflow-visible"
          >
            <path
              d="M 10 2 Q 100 0 190 2"
              stroke="#C19E5A"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}
