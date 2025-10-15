"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import NavigationTabs from "./components/NavigationTabs";
import SearchBar from "./components/SearchBar";
import PieceCard from "./components/PieceCard";

interface PieceData {
  id: string;
  article: string;
  color: string;
  measure: string;
  originalData?: unknown;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"CLADD" | "IMPORTADO">("CLADD");
  const [searchTerm, setSearchTerm] = useState("");
  const [pieces, setPieces] = useState<PieceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importadoDataLoaded, setImportadoDataLoaded] = useState(false);
  const [importadoLoading, setImportadoLoading] = useState(true);

  const searchPiece = async (nroSerie: string) => {
    if (!nroSerie.trim()) {
      setError("Por favor ingrese un número de serie");
      return;
    }

    // Check if piece already exists in the list
    const existingPiece = pieces.find((piece) => piece.id === nroSerie);
    if (existingPiece) {
      setError("Esta pieza ya está en la lista");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === "CLADD") {
        const response = await fetch(
          `/api/cladd/pieza?nroSerie=${encodeURIComponent(nroSerie)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Pieza no encontrada");
          } else {
            setError("Error al buscar la pieza");
          }
          return;
        }

        const data = await response.json();
        // Add to the existing list instead of replacing
        setPieces((prevPieces) => [...prevPieces, data]);
        setSearchTerm(""); // Clear search input after successful search
      } else {
        // Check if IMPORTADO data is loaded
        if (!importadoDataLoaded) {
          setError("Cargando datos IMPORTADO, por favor espere...");
          return;
        }

        // IMPORTADO local search (using cached data)
        const response = await fetch(
          `/api/importado/pieza?codigoCompleto=${encodeURIComponent(nroSerie)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Pieza no encontrada");
          } else {
            setError("Error al buscar la pieza");
          }
          return;
        }

        const data = await response.json();
        // Add to the existing list instead of replacing
        setPieces((prevPieces) => [...prevPieces, data]);
        setSearchTerm(""); // Clear search input after successful search
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      searchPiece(searchTerm);
    }
  };

  // Load IMPORTADO data on app start
  useEffect(() => {
    const loadImportadoData = async () => {
      try {
        setImportadoLoading(true);
        // Trigger the loading by calling the /all endpoint
        const response = await fetch("/api/importado/all");
        if (response.ok) {
          const result = await response.json();
          console.log(`IMPORTADO data loaded: ${result.count} pieces`);
          console.log(
            `EJEMPLO DE NUMERO DE PIEZA: ${result.data[41].NumeroPieza}`
          );
          setImportadoDataLoaded(true);
        } else {
          console.error("Failed to load IMPORTADO data");
        }
      } catch (error) {
        console.error("Error loading IMPORTADO data:", error);
      } finally {
        setImportadoLoading(false);
      }
    };

    loadImportadoData();
  }, []);

  const handleDeletePiece = (id: string) => {
    console.log("Delete piece:", id);
    setPieces(pieces.filter((piece) => piece.id !== id));
  };

  const handlePrintPiece = (piece: PieceData) => {
    console.log("Print piece:", piece);
    // TODO: Implement print functionality
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-md mx-auto px-4 py-6">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onKeyPress={handleKeyPress}
          placeholder={
            activeTab === "CLADD"
              ? "Buscar pieza CLADD (presione Enter)"
              : importadoLoading
              ? "Cargando datos IMPORTADO..."
              : "Buscar pieza IMPORTADO (presione Enter)"
          }
        />

        {/* IMPORTADO Data Loading Status */}
        {activeTab === "IMPORTADO" && importadoLoading && (
          <div className="mt-2 text-center text-sm text-[#C19E5A]">
            Cargando datos IMPORTADO desde la base de datos...
          </div>
        )}

        {activeTab === "IMPORTADO" &&
          importadoDataLoaded &&
          !importadoLoading && (
            <div className="mt-2 text-center text-sm text-green-600">
              ✓ Datos IMPORTADO cargados y listos
            </div>
          )}

        {/* Loading State */}
        {loading && (
          <div className="mt-4 text-center text-[#4A4A4A]">
            Buscando pieza...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mt-4 text-center text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="mt-4">
          <div className="max-h-[420px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {pieces
              .slice()
              .reverse() // Show newest first (most recently added at the top)
              .map((piece) => (
                <PieceCard
                  key={piece.id}
                  id={piece.id}
                  article={piece.article}
                  color={piece.color}
                  measure={piece.measure}
                  onDelete={() => handleDeletePiece(piece.id)}
                  onPrint={() => handlePrintPiece(piece)}
                />
              ))}
          </div>
        </div>

        {/* Empty State */}
        {!loading && !error && pieces.length === 0 && (
          <div className="mt-4 text-center text-[#4A4A4A]">
            {searchTerm
              ? "No se encontraron piezas"
              : "Ingrese un número de serie y presione Enter"}
          </div>
        )}

        {/* List Info */}
        {pieces.length > 0 && (
          <div className="mt-4 text-center text-sm text-[#4A4A4A]">
            {pieces.length} pieza{pieces.length !== 1 ? "s" : ""} en la lista
          </div>
        )}
      </div>
    </div>
  );
}
