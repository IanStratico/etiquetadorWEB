import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nroSerie = searchParams.get("nroSerie");

    if (!nroSerie) {
      return NextResponse.json(
        { error: "nroSerie parameter is required" },
        { status: 400 }
      );
    }

    // Make request to CLADD API
    const claddApiUrl = `http://192.168.1.32:8010/api/piezasCladd/piezaPorNroSerie?nroSerie=${nroSerie}`;

    const response = await fetch(claddApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from CLADD API" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the response to match our UI format
    const transformedData = {
      id: data.nroSerie,
      article: `${data.descripcionArticulo}`,
      codArticulo: `${data.codArticulo ?? ""}`,
      color: `${data.descripcionColor}`,
      measure: `${data.peso}`,
      originalData: data, // Keep original data for reference
      source: "CLADD" as const,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching from CLADD API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
