"use client";

import { useState, useEffect } from "react";

interface GrupoDto {
  id: number;
  nombre: string;
  tipos: string[];
}

interface ArticuloDto {
  codigo: string;
  descripcion: string;
  descAdicional: string | null;
  codBase: string;
  nombreBase: string;
  idColorWeb: string | null;
}

interface PieceData {
  clientId: string;
  id: string;
  article: string;
  codArticulo: string;
  color: string;
  measure: string;
  idColorWeb: string;
  originalData?: unknown;
  source: "CLADD" | "IMPORTADO" | "MANUAL";
}

interface ManualWizardProps {
  onAddPiece: (piece: PieceData) => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

function createClientId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-[#4A4A4A] hover:text-[#1A2753] transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      volver
    </button>
  );
}

export default function ManualWizard({ onAddPiece }: ManualWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [grupos, setGrupos] = useState<GrupoDto[]>([]);
  const [gruposLoading, setGruposLoading] = useState(true);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoDto | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);
  const [articulos, setArticulos] = useState<ArticuloDto[]>([]);
  const [articulosLoading, setArticulosLoading] = useState(false);
  const [selectedBase, setSelectedBase] = useState<ArticuloDto | null>(null);
  const [selectedColor, setSelectedColor] = useState<ArticuloDto | null>(null);
  const [peso, setPeso] = useState("");
  const [mismoColor, setMismoColor] = useState(false);

  useEffect(() => {
    fetch("/api/lnt/grupos")
      .then((r) => r.json())
      .then((data: GrupoDto[]) => {
        if (Array.isArray(data)) setGrupos(data);
      })
      .catch((err) => console.error("Error loading grupos:", err))
      .finally(() => setGruposLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTipo) return;
    setArticulosLoading(true);
    setSelectedBase(null);
    setSelectedColor(null);
    fetch(`/api/lnt/articulos?tipo=${encodeURIComponent(selectedTipo)}&limit=500`)
      .then((r) => r.json())
      .then((data: { items?: ArticuloDto[] } | ArticuloDto[]) => {
        const items = Array.isArray(data) ? data : (data.items ?? []);
        setArticulos(items);
      })
      .catch((err) => console.error("Error loading articulos:", err))
      .finally(() => setArticulosLoading(false));
  }, [selectedTipo]);

  const articulosBase = articulos.filter((a) => !a.descAdicional);

  const hasColores = (base: ArticuloDto) =>
    articulos.some((a) => a.codBase === base.codBase && !!a.descAdicional);

  const coloresDisponibles = selectedBase
    ? articulos.filter((a) => a.codBase === selectedBase.codBase && !!a.descAdicional)
    : [];

  const pesoValido = /^\d{1,2}(\.\d{1,2})?$/.test(peso);

  const breadcrumbParts = [
    selectedGrupo?.nombre,
    selectedTipo,
    selectedBase?.nombreBase,
    selectedColor?.descAdicional,
  ].filter(Boolean);

  const handleAgregar = () => {
    if (!selectedBase || !selectedColor || !pesoValido) return;
    onAddPiece({
      clientId: createClientId(),
      id: createClientId(),
      article: selectedBase.nombreBase,
      codArticulo: selectedColor.codigo,
      color: selectedColor.descAdicional ?? "",
      measure: peso,
      idColorWeb: selectedColor.idColorWeb ?? "",
      source: "MANUAL",
      originalData: selectedColor,
    });
    setPeso("");
    if (!mismoColor) {
      setSelectedColor(null);
      setStep(4);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {step > 1 && breadcrumbParts.length > 0 && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-[#4A4A4A]">
          {breadcrumbParts.join(" › ")}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#1A2753]">Seleccioná un grupo</p>
          {gruposLoading ? (
            <div className="py-6 text-center text-sm text-[#4A4A4A]">Cargando grupos...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {grupos.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setSelectedGrupo(g); setStep(2); }}
                  className="min-h-[56px] rounded-xl border-2 border-[#1A2753] px-4 py-3 text-sm font-semibold text-[#1A2753] transition-colors hover:bg-[#1A2753] hover:text-white active:bg-[#1A2753] active:text-white"
                >
                  {g.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedGrupo && (
        <div className="space-y-3">
          <BackButton onClick={() => { setSelectedGrupo(null); setStep(1); }} />
          <p className="text-sm font-semibold text-[#1A2753]">Seleccioná un tipo</p>
          <div className="flex flex-wrap gap-2">
            {selectedGrupo.tipos.map((tipo) => (
              <button
                key={tipo}
                onClick={() => { setSelectedTipo(tipo); setStep(3); }}
                className="min-h-[48px] rounded-xl border-2 border-[#1A2753] px-5 py-2 text-sm font-semibold text-[#1A2753] transition-colors hover:bg-[#1A2753] hover:text-white active:bg-[#1A2753] active:text-white"
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <BackButton onClick={() => { setSelectedTipo(null); setArticulos([]); setStep(2); }} />
          <p className="text-sm font-semibold text-[#1A2753]">Seleccioná un artículo</p>
          {articulosLoading ? (
            <div className="py-6 text-center text-sm text-[#4A4A4A]">Cargando artículos...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {articulosBase.map((a) => {
                const disponible = hasColores(a);
                return (
                  <button
                    key={a.codigo}
                    disabled={!disponible}
                    onClick={() => { setSelectedBase(a); setStep(4); }}
                    className={`min-h-[56px] rounded-xl border-2 px-3 py-3 text-left text-sm transition-colors ${
                      disponible
                        ? "border-[#1A2753] text-[#1A2753] hover:bg-[#1A2753] hover:text-white active:bg-[#1A2753] active:text-white"
                        : "border-gray-200 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <div className="font-semibold leading-tight">{a.nombreBase}</div>
                    <div className="mt-1 font-mono text-xs opacity-60">{a.codigo}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 4 && selectedBase && (
        <div className="space-y-3">
          <BackButton onClick={() => { setSelectedBase(null); setStep(3); }} />
          <p className="text-sm font-semibold text-[#1A2753]">Seleccioná un color</p>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {coloresDisponibles.map((c) => (
              <button
                key={c.codigo}
                onClick={() => { setSelectedColor(c); setStep(5); }}
                className="min-h-[56px] rounded-xl border-2 border-[#1A2753] px-3 py-3 text-left text-sm text-[#1A2753] transition-colors hover:bg-[#1A2753] hover:text-white active:bg-[#1A2753] active:text-white"
              >
                <div className="font-semibold leading-tight">{c.descAdicional}</div>
                <div className="mt-1 font-mono text-xs opacity-60">{c.codigo}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && selectedBase && selectedColor && (
        <div className="space-y-4">
          <BackButton onClick={() => { setSelectedColor(null); setStep(4); }} />
          <p className="text-sm font-semibold text-[#1A2753]">Ingresá el peso (kg)</p>
          <input
            type="text"
            inputMode="decimal"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="ej: 12.50"
            autoFocus
            className="w-full rounded-xl border-2 border-gray-300 px-4 py-4 text-center font-mono text-2xl focus:border-[#C19E5A] focus:outline-none"
          />
          {peso && !pesoValido && (
            <p className="text-xs text-red-500">Formato inválido. Usá hasta 2 dígitos y 2 decimales (ej: 12.50)</p>
          )}
          <label className="flex cursor-pointer select-none items-center gap-3">
            <input
              type="checkbox"
              checked={mismoColor}
              onChange={(e) => setMismoColor(e.target.checked)}
              className="h-5 w-5 accent-[#1A2753]"
            />
            <span className="text-sm text-[#4A4A4A]">Seguir con el mismo color</span>
          </label>
          <button
            onClick={handleAgregar}
            disabled={!pesoValido}
            className={`w-full min-h-[52px] rounded-xl text-base font-semibold text-white transition-colors ${
              pesoValido
                ? "bg-[#1A2753] hover:bg-[#C19E5A] active:bg-[#C19E5A]"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}
