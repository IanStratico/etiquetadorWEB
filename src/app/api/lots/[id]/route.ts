import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/typeorm";
import { Lot } from "@/lib/entities/Lot";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const lotId = Number(id);

    if (Number.isNaN(lotId)) {
      return NextResponse.json(
        { error: "Identificador de lote inválido" },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const lotRepository = dataSource.getRepository(Lot);

    const lot = await lotRepository.findOne({
      where: { id: lotId },
      relations: ["pieces"],
      order: {
        pieces: {
          createdDate: "DESC",
        },
      },
    });

    if (!lot) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lot: {
        id: lot.id,
        code: lot.lotCode,
        pieceCount: lot.pieceCount,
        downloadCount: lot.downloadCount,
        createdDate: lot.createdDate.toISOString(),
      },
      pieces: lot.pieces.map((piece) => ({
        id: piece.id,
        pieceId: piece.pieceId,
        codArticulo: piece.codArticulo,
        source: piece.source,
        article: piece.article,
        color: piece.color,
        measure: piece.measure,
        createdDate: piece.createdDate.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching lot detail:", error);
    return NextResponse.json(
      { error: "Error al cargar el lote" },
      { status: 500 }
    );
  }
}
