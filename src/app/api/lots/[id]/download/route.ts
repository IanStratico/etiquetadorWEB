import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/typeorm";
import { Lot } from "@/lib/entities/Lot";
import * as XLSX from "xlsx";

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

    const lot = await dataSource.getRepository(Lot).findOne({
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

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Cód. artículo", "Id Color", "Color", "ID interno", "Medida"],
      ...lot.pieces.map((piece) => [
        piece.codArticulo,
        piece.idColorWeb, // Placeholder for Id Color
        piece.color,
        piece.id,
        piece.measure,
      ]),
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lote");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    }) as Buffer;

    lot.downloadCount += 1;
    await dataSource.getRepository(Lot).save(lot);

    const filename = `lote-${lot.lotCode}.xlsx`;

    const uint8 = new Uint8Array(buffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating lot excel:", error);
    return NextResponse.json(
      { error: "Error al generar el archivo del lote" },
      { status: 500 }
    );
  }
}
