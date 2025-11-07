import { NextRequest, NextResponse } from "next/server";
import { Piece } from "@/lib/entities/Piece";
import { getDataSource } from "@/lib/typeorm";

const PRINTER_API_URL =
  process.env.PRINTER_API_URL ??
  "http://192.168.1.119/etiquetador/apiWeb/testImpresora.php";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const piece = Number(id);
    const dataSource = await getDataSource();
    const pieceRepository = dataSource.getRepository(Piece);
    const existingPiece: Piece | null = await pieceRepository.findOne({
      where: { id: piece },
      relations: ["lot"],
    });

    if (!existingPiece) {
      return NextResponse.json(
        { error: "Pieza no encontrada" },
        { status: 404 }
      );
    } else {
      try {
        const params = new URLSearchParams({
          id: existingPiece.id.toString(),
          articulo: existingPiece.article,
          color: existingPiece.color,
          peso: existingPiece.measure,
          lote: existingPiece.lot.lotCode,
        });

        const response = await fetch(`${PRINTER_API_URL}?${params.toString()}`);

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          console.error(
            `Error printing label for piece ${existingPiece.id}: ${response.status} ${body}`
          );
        }
      } catch (printerError) {
        console.error(
          `Error connecting to printer for piece ${existingPiece.id}:`,
          printerError
        );
      }
    }

    return NextResponse.json({ piece: existingPiece }, { status: 200 });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
