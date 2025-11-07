import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/typeorm";
import { Lot } from "@/lib/entities/Lot";

export async function GET() {
  try {
    const dataSource = await getDataSource();
    const lotRepository = dataSource.getRepository(Lot);

    const lots = await lotRepository.find({
      order: { createdDate: "DESC" },
    });

    return NextResponse.json({
      lots: lots.map((lot) => ({
        id: lot.id,
        code: lot.lotCode,
        pieceCount: lot.pieceCount,
        downloadCount: lot.downloadCount,
        createdDate: lot.createdDate.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching lots:", error);
    return NextResponse.json(
      { error: "Error al cargar los lotes" },
      { status: 500 }
    );
  }
}
