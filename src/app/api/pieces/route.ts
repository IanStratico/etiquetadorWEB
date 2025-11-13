import { NextRequest, NextResponse } from "next/server";
import { Piece } from "@/lib/entities/Piece";
import { Lot } from "@/lib/entities/Lot";
import { getDataSource } from "@/lib/typeorm";
import type { PieceSource } from "@/lib/entities/Piece";

const PRINTER_API_URL =
  process.env.PRINTER_API_URL ??
  "http://192.168.1.119/etiquetador/apiWeb/testImpresora.php";

interface IncomingPiece {
  id: string;
  article: string;
  codArticulo: string;
  color: string;
  measure: string;
  idColorWeb: string;
  source: PieceSource;
  originalData?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pieces: IncomingPiece[] | undefined = body?.pieces;

    if (!Array.isArray(pieces) || pieces.length === 0) {
      return NextResponse.json(
        { error: "La lista de piezas está vacía" },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();

    const timestamp = new Date();
    const lotCode = [
      "LOT",
      timestamp.getFullYear(),
      String(timestamp.getMonth() + 1).padStart(2, "0"),
      String(timestamp.getDate()).padStart(2, "0"),
      String(timestamp.getHours()).padStart(2, "0"),
      String(timestamp.getMinutes()).padStart(2, "0"),
      String(timestamp.getSeconds()).padStart(2, "0"),
    ].join("-");

    let savedLot: Lot | null = null;
    let savedPieces: Piece[] = [];

    const lotRepository = dataSource.getRepository(Lot);
    const pieceRepository = dataSource.getRepository(Piece);

    savedLot = await lotRepository.save(
      lotRepository.create({
        lotCode,
        pieceCount: pieces.length,
      })
    );

    const entities = pieces.map((piece) =>
      pieceRepository.create({
        pieceId: piece.id,
        source: piece.source,
        article: piece.article,
        codArticulo: piece.codArticulo.padStart(5, "0"),
        color: piece.color,
        measure: piece.measure,
        idColorWeb: piece.idColorWeb,
        data: piece.originalData ?? null,
        lot: savedLot!,
      })
    );

    savedPieces = await pieceRepository.save(entities);

    if (savedLot && savedPieces.length > 0) {
      console.log(savedPieces);

      for (const piece of savedPieces) {
        console.log("Printing label for piece:", piece.pieceId);
        try {
          const params = new URLSearchParams({
            id: piece.id.toString(),
            articulo: piece.article,
            color: piece.color,
            peso: piece.measure,
            lote: savedLot!.lotCode,
          });
          console.log(params.toString());

          const response = await fetch(
            `${PRINTER_API_URL}?${params.toString()}`
          );

          if (!response.ok) {
            const body = await response.text().catch(() => "");
            console.error(
              `Error printing label for piece ${piece.pieceId}: ${response.status} ${body}`
            );
          }
          console.log(response);
        } catch (printerError) {
          console.error(
            `Error connecting to printer for piece ${piece.pieceId}:`,
            printerError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: savedPieces.length,
      ids: savedPieces.map((item) => item.id),
      lot: savedLot
        ? {
            id: savedLot.id,
            code: savedLot.lotCode,
            createdAt: savedLot.createdDate,
            pieceCount: savedLot.pieceCount,
          }
        : null,
    });
  } catch (error) {
    console.error("Error saving pieces:", error);
    return NextResponse.json(
      { error: "Error al guardar las piezas" },
      { status: 500 }
    );
  }
}
