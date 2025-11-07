import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoCompleto = searchParams.get("codigoCompleto");

    if (!codigoCompleto) {
      return NextResponse.json(
        { error: "codigoCompleto parameter is required" },
        { status: 400 }
      );
    }

    // Extract numeroPieza from the complete code
    // Format: "54999000       022.40"
    // Characters 0-14: numeroPieza (trimmed)
    const numeroPieza = codigoCompleto.substring(0, 15).trim();

    // Load data from the /all endpoint
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3040";
    const response = await fetch(`${baseUrl}/api/importado/all`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error loading IMPORTADO data" },
        { status: 500 }
      );
    }

    const result = await response.json();
    const importadoData = result.data;

    console.log(
      `Searching for numeroPieza: "${numeroPieza}" in ${importadoData.length} pieces`
    );
    console.log(
      `First 5 pieces:`,
      importadoData
        .slice(0, 5)
        .map((p: { NumeroPieza: string }) => p.NumeroPieza)
    );

    // Search in the loaded data
    const foundPiece = importadoData.find(
      (piece: { NumeroPieza: string }) => piece.NumeroPieza === numeroPieza
    );

    if (!foundPiece) {
      return NextResponse.json(
        { error: "Pieza no encontrada en IMPORTADO" },
        { status: 404 }
      );
    }

    // Extract peso from the complete code (last 5 characters)
    const peso = codigoCompleto.substring(codigoCompleto.length - 5).trim();

    // Transform the response to match our UI format
    const transformedData = {
      id: codigoCompleto, // Use the complete code as ID
      article: `Artículo: ${foundPiece.NombreArticulo}`,
      color: `Color: ${foundPiece.ColorPorArticulo}`,
      measure: `Medida: ${peso} kg`,
      originalData: {
        ...foundPiece,
        peso: peso,
        codigoCompleto: codigoCompleto,
      },
      source: "IMPORTADO" as const,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error searching IMPORTADO data:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Export function to reload data manually (no la estoy usando en ningun lado)
export async function POST() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3040";
    const response = await fetch(`${baseUrl}/api/importado/all`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error reloading data" },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      message: `Data reloaded. ${result.count} pieces loaded.`,
      loadedAt: result.loadedAt,
    });
  } catch (error) {
    console.error("Error reloading IMPORTADO data:", error);
    return NextResponse.json(
      { error: "Error reloading data" },
      { status: 500 }
    );
  }
}
