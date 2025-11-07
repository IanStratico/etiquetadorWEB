import { NextRequest, NextResponse } from "next/server";
import { Piece } from "@/lib/entities/Piece";
import { getDataSource } from "@/lib/typeorm";
import type { PieceSource } from "@/lib/entities/Piece";

interface IncomingPiece {
  id: string;
  article: string;
  color: string;
  measure: string;
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
    const repository = dataSource.getRepository(Piece);

    const entities = pieces.map((piece) =>
      repository.create({
        pieceId: piece.id,
        source: piece.source,
        article: piece.article,
        color: piece.color,
        measure: piece.measure,
        data: piece.originalData ?? null,
      })
    );

    const saved = await repository.save(entities);

    return NextResponse.json({
      success: true,
      count: saved.length,
      ids: saved.map((item) => item.id),
    });
  } catch (error) {
    console.error("Error saving pieces:", error);
    return NextResponse.json(
      { error: "Error al guardar las piezas" },
      { status: 500 }
    );
  }
}
