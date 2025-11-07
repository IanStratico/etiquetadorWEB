"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import NavigationTabs from "./components/NavigationTabs";
import SearchBar from "./components/SearchBar";
import PieceCard from "./components/PieceCard";

interface PieceData {
  clientId: string;
  id: string;
  article: string;
  codArticulo: string;
  color: string;
  measure: string;
  originalData?: unknown;
  source: "CLADD" | "IMPORTADO";
}

type FetchedPieceData = Omit<PieceData, "clientId">;

interface LotSummary {
  id: number;
  code: string;
  pieceCount: number;
  downloadCount: number;
  createdDate: string;
}

interface LotPiece {
  id: number;
  pieceId: string;
  codArticulo: string;
  source: "CLADD" | "IMPORTADO";
  article: string;
  color: string;
  measure: string;
  createdDate: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"CLADD" | "IMPORTADO">("CLADD");
  const [searchTerm, setSearchTerm] = useState("");
  const [pieces, setPieces] = useState<PieceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importadoDataLoaded, setImportadoDataLoaded] = useState(false);
  const [importadoLoading, setImportadoLoading] = useState(true);
  const [savingPieces, setSavingPieces] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [lots, setLots] = useState<LotSummary[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [lotsError, setLotsError] = useState<string | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [selectedLot, setSelectedLot] = useState<LotSummary | null>(null);
  const [selectedLotPieces, setSelectedLotPieces] = useState<LotPiece[]>([]);
  const [selectedLotLoading, setSelectedLotLoading] = useState(false);
  const [selectedLotError, setSelectedLotError] = useState<string | null>(null);
  const [lotDownloadLoading, setLotDownloadLoading] = useState(false);

  const createClientId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const fetchLotDetail = useCallback(
    async (lotId: number, options?: { signal?: AbortSignal }) => {
      setSelectedLotLoading(true);
      setSelectedLotError(null);
      try {
        const response = await fetch(`/api/lots/${lotId}`, {
          signal: options?.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Lote no encontrado");
          }
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.error || "Error al cargar el lote");
        }

        const detail = (await response.json()) as {
          lot: LotSummary;
          pieces: LotPiece[];
        };

        setSelectedLot(detail.lot);
        setSelectedLotPieces(detail.pieces);
        setLots((prevLots) => {
          const exists = prevLots.some((lot) => lot.id === detail.lot.id);
          if (!exists) {
            return [detail.lot, ...prevLots];
          }
          return prevLots.map((lot) =>
            lot.id === detail.lot.id ? { ...lot, ...detail.lot } : lot
          );
        });
      } catch (fetchError) {
        if (options?.signal?.aborted) {
          return;
        }
        console.error("Error loading lot detail:", fetchError);
        setSelectedLot(null);
        setSelectedLotPieces([]);
        setSelectedLotError(
          fetchError instanceof Error
            ? fetchError.message
            : "Error al cargar el lote"
        );
      } finally {
        setSelectedLotLoading(false);
      }
    },
    []
  );

  const loadLots = useCallback(async (signal?: AbortSignal) => {
    setLotsLoading(true);
    setLotsError(null);
    setSelectedLotError(null);
    try {
      const response = await fetch("/api/lots", { signal });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Error al cargar los lotes");
      }

      const data = (await response.json()) as { lots: LotSummary[] };

      if (signal?.aborted) {
        return;
      }

      setLots(data.lots);

      if (data.lots.length === 0) {
        setSelectedLotId(null);
        setSelectedLot(null);
        setSelectedLotPieces([]);
      } else {
        setSelectedLotId((previous) => {
          if (previous && data.lots.some((lot) => lot.id === previous)) {
            return previous;
          }
          return data.lots[0].id;
        });
      }
    } catch (loadError) {
      if (signal?.aborted) {
        return;
      }
      console.error("Error loading lots:", loadError);
      setLotsError(
        loadError instanceof Error
          ? loadError.message
          : "Error al cargar los lotes"
      );
    } finally {
      if (!signal?.aborted) {
        setLotsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLotModalOpen) {
      return;
    }

    const controller = new AbortController();
    void loadLots(controller.signal);

    return () => {
      controller.abort();
    };
  }, [isLotModalOpen, loadLots]);

  useEffect(() => {
    if (!isLotModalOpen || selectedLotId === null) {
      return;
    }

    const controller = new AbortController();
    void fetchLotDetail(selectedLotId, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [isLotModalOpen, selectedLotId, fetchLotDetail]);

  const handleLotSelectionChange = (value: string) => {
    if (!value) {
      setSelectedLotId(null);
      setSelectedLot(null);
      setSelectedLotPieces([]);
      return;
    }

    const lotId = Number(value);
    if (Number.isNaN(lotId)) {
      return;
    }

    setSelectedLotId(lotId);
  };

  const handleLotModalOpen = () => {
    setLotsError(null);
    setSelectedLotError(null);
    setIsLotModalOpen(true);
  };

  const handleLotModalClose = () => {
    setIsLotModalOpen(false);
    setLotDownloadLoading(false);
  };

  const handleDownloadLot = async () => {
    if (!selectedLotId) {
      return;
    }

    setLotDownloadLoading(true);
    setSelectedLotError(null);

    try {
      const response = await fetch(`/api/lots/${selectedLotId}/download`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error || "Error al descargar el archivo del lote"
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const suggestedName = selectedLot
        ? `lote-${selectedLot.code}.xlsx`
        : `lote-${selectedLotId}.xlsx`;
      link.href = url;
      link.download = suggestedName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await fetchLotDetail(selectedLotId);
    } catch (downloadError) {
      console.error("Download lot error:", downloadError);
      setSelectedLotError(
        downloadError instanceof Error
          ? downloadError.message
          : "Error al descargar el lote"
      );
    } finally {
      setLotDownloadLoading(false);
    }
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  const searchPiece = async (nroSerie: string) => {
    if (!nroSerie.trim()) {
      setError("Por favor ingrese un número de serie");
      return;
    }

    if (activeTab === "CLADD") {
      const existingPiece = pieces.find(
        (piece) => piece.source === "CLADD" && piece.id === nroSerie
      );
      if (existingPiece) {
        setError("Esta pieza ya está en la lista");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSaveMessage(null);
    setSaveError(null);

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

        const data: FetchedPieceData = await response.json();
        // Add to the existing list instead of replacing
        setPieces((prevPieces) => [
          ...prevPieces,
          { ...data, clientId: createClientId() },
        ]);
        console.log(data);
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

        const data: FetchedPieceData = await response.json();
        // Add to the existing list instead of replacing
        setPieces((prevPieces) => [
          ...prevPieces,
          { ...data, clientId: createClientId() },
        ]);
        setSearchTerm(""); // Clear search input after successful search
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
      console.log(pieces);
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

  const handleDeletePiece = (clientId: string) => {
    console.log("Delete piece:", clientId);
    setPieces((prevPieces) =>
      prevPieces.filter((piece) => piece.clientId !== clientId)
    );
  };

  const handlePrintPiece = async (piece: number) => {
    console.log("Print piece:", piece);
    try {
      const response = await fetch(`/api/pieces/${piece}`, { method: "GET" });
      if (!response.ok) {
        console.error(`Error printing label`);
      }
      console.log(response);
    } catch (e) {
      console.error(`Error:`, e);
    }
  };

  const handleSavePieces = async () => {
    if (pieces.length === 0 || savingPieces) {
      return;
    }

    setSavingPieces(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/pieces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pieces: pieces.map(({ clientId, ...piece }) => {
            void clientId;
            return piece;
          }),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Error al guardar las piezas");
      }

      const result = await response.json();
      setSaveMessage(
        `Se guardaron ${result.count} pieza${
          result.count === 1 ? "" : "s"
        } correctamente.`
      );
    } catch (err) {
      console.error("Save pieces error:", err);
      setSaveError(
        err instanceof Error ? err.message : "Error al guardar las piezas"
      );
    } finally {
      setSavingPieces(false);
      setPieces([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <aside className="sticky top-0 flex h-screen w-56 flex-col border-r border-gray-200 bg-white px-4 py-6">
        <button
          onClick={handleLotModalOpen}
          className="rounded-lg border border-[#1A2753] px-4 py-2 text-sm font-semibold text-[#1A2753] transition-colors hover:bg-[#1A2753] hover:text-white"
        >
          LOTES
        </button>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-md px-4 py-6">
            <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="mt-4">
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
            </div>

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

            {loading && (
              <div className="mt-4 text-center text-[#4A4A4A]">
                Buscando pieza...
              </div>
            )}

            {error && !loading && (
              <div className="mt-4 text-center text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-4">
              <div className="max-h-[420px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {pieces
                  .slice()
                  .reverse()
                  .map((piece) => (
                    <PieceCard
                      key={piece.clientId}
                      id={piece.id}
                      article={piece.article}
                      color={piece.color}
                      measure={piece.measure}
                      onDelete={() => handleDeletePiece(piece.clientId)}
                      onPrint={() => {}}
                    />
                  ))}
              </div>
            </div>

            {!loading && !error && pieces.length === 0 && (
              <div className="mt-4 text-center text-[#4A4A4A]">
                {searchTerm
                  ? "No se encontraron piezas"
                  : "Ingrese un número de serie y presione Enter"}
              </div>
            )}

            {pieces.length >= 0 && (
              <div className="mt-4 text-center text-sm text-[#4A4A4A]">
                {pieces.length} pieza{pieces.length !== 1 ? "s" : ""} en la
                lista
              </div>
            )}

            {pieces.length >= 0 && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  onClick={handleSavePieces}
                  disabled={savingPieces}
                  className={`w-full max-w-xs rounded-lg bg-[#1A2753] px-4 py-2 text-white transition-colors ${
                    savingPieces ? "opacity-70" : "hover:bg-[#C19E5A]"
                  }`}
                >
                  {savingPieces ? "Guardando piezas..." : "Guardar piezas"}
                </button>

                {saveMessage && (
                  <div className="w-full max-w-xs rounded-md bg-green-50 px-3 py-2 text-center text-sm text-green-600">
                    {saveMessage}
                  </div>
                )}

                {saveError && (
                  <div className="w-full max-w-xs rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                    {saveError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1A2753]">
                Seleccionar lote
              </h2>
              <button
                onClick={handleLotModalClose}
                className="text-sm font-medium text-[#1A2753] hover:text-[#C19E5A]"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A2753]">
                  Lote
                </label>
                <select
                  value={selectedLotId ?? ""}
                  onChange={(event) =>
                    handleLotSelectionChange(event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C19E5A] focus:outline-none focus:ring-1 focus:ring-[#C19E5A]"
                  disabled={lotsLoading || lots.length === 0}
                >
                  <option value="" disabled>
                    {lotsLoading ? "Cargando lotes..." : "Seleccione un lote"}
                  </option>
                  {lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.code} — {lot.pieceCount} pieza
                      {lot.pieceCount === 1 ? "" : "s"} —{" "}
                      {formatDateTime(lot.createdDate)}
                    </option>
                  ))}
                </select>
                {lotsError && (
                  <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {lotsError}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                  <div className="text-sm font-semibold text-[#1A2753]">
                    {selectedLot
                      ? `${selectedLot.code} · ${selectedLot.pieceCount} pieza${
                          selectedLot.pieceCount === 1 ? "" : "s"
                        }`
                      : "Sin lote seleccionado"}
                  </div>
                  {selectedLot && (
                    <div className="text-xs text-[#4A4A4A]">
                      Descargas: {selectedLot.downloadCount}
                    </div>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {selectedLotLoading && (
                    <div className="px-4 py-6 text-center text-sm text-[#4A4A4A]">
                      Cargando piezas del lote...
                    </div>
                  )}

                  {!selectedLotLoading && selectedLotError && (
                    <div className="px-4 py-6 text-center text-sm text-red-600">
                      {selectedLotError}
                    </div>
                  )}

                  {!selectedLotLoading &&
                    !selectedLotError &&
                    selectedLotPieces.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-[#4A4A4A]">
                        {selectedLot
                          ? "El lote no tiene piezas registradas."
                          : "Seleccione un lote para ver sus piezas."}
                      </div>
                    )}

                  {!selectedLotLoading &&
                    !selectedLotError &&
                    selectedLotPieces.length > 0 && (
                      <table className="min-w-full text-sm">
                        <thead className="bg-[#F8F9FA] text-left text-[#1A2753]">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Código</th>
                            <th className="px-3 py-2 font-semibold">Fuente</th>
                            <th className="px-3 py-2 font-semibold">
                              Artículo
                            </th>
                            <th className="px-3 py-2 font-semibold">Color</th>
                            <th className="px-3 py-2 font-semibold">Medida</th>
                            <th className="px-3 py-2 font-semibold">Fecha</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLotPieces.map((piece) => (
                            <tr
                              key={piece.id}
                              className="border-t border-gray-100 text-[#4A4A4A]"
                            >
                              <td className="px-3 py-2">{piece.pieceId}</td>
                              <td className="px-3 py-2">{piece.source}</td>
                              <td className="px-3 py-2">{piece.article}</td>
                              <td className="px-3 py-2">{piece.color}</td>
                              <td className="px-3 py-2">{piece.measure}</td>
                              <td className="px-3 py-2">
                                {formatDateTime(piece.createdDate)}
                              </td>
                              <td>
                                <button
                                  onClick={() => {
                                    handlePrintPiece(piece.id);
                                  }}
                                  className="text-[#1A2753] hover:text-[#C19E5A] transition-colors"
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
                                    <rect
                                      x="6"
                                      y="14"
                                      width="12"
                                      height="8"
                                    ></rect>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleDownloadLot}
                  disabled={
                    lotDownloadLoading ||
                    selectedLotId === null ||
                    selectedLotLoading ||
                    !!selectedLotError ||
                    selectedLotPieces.length === 0
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                    lotDownloadLoading ||
                    selectedLotId === null ||
                    selectedLotLoading ||
                    !!selectedLotError ||
                    selectedLotPieces.length === 0
                      ? "bg-gray-300"
                      : "bg-[#1A2753] hover:bg-[#C19E5A]"
                  }`}
                >
                  {lotDownloadLoading ? "Descargando..." : "DESCARGAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
