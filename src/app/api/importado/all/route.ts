import { NextResponse } from "next/server";
import sql from "mssql";

const config = {
  server: "TANGO\\AXSQLEXPRESS",
  database: "LA_NUEVA_TEXTIL",
  user: "Axoft",
  password: "Axoft",
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

export async function GET() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log("Loading IMPORTADO data from database...");

    // Create and connect to SQL Server
    pool = new sql.ConnectionPool(config);
    await pool.connect();

    const query = `
      SELECT  articulos.COD_ARTICU as NumeroPieza,
              articulos.DESCRIPCIO as ColorArticulo,
              articulos.DESC_ADIC as ColorPorArticulo,
              articulos.BASE as NumeroArticulo,
              articulos2.DESCRIPCIO as NombreArticulo,
              precios.PRECIO as PrecioArticulo,
              carpetas.DESCRIP as TipoArticulo
      FROM STA11 articulos
      JOIN LA_NUEVA_TEXTIL.dbo.STA11ITC articulosxcarpeta
          ON articulos.COD_ARTICU = articulosxcarpeta.CODE
      JOIN LA_NUEVA_TEXTIL.dbo.STA11FLD carpetas
          ON carpetas.IDFOLDER = articulosxcarpeta.IDFOLDER
      JOIN LA_NUEVA_TEXTIL.dbo.STA11 articulos2
          ON articulos.BASE = articulos2.COD_ARTICU
      JOIN LA_NUEVA_TEXTIL.dbo.GVA17 precios
          ON articulos.ID_STA11 = precios.ID_STA11
      JOIN LA_NUEVA_TEXTIL.dbo.GVA10 listasdeprecio
          ON precios.ID_GVA10 = listasdeprecio.ID_GVA10
      WHERE   (listasdeprecio.NRO_DE_LIS = 1 OR listasdeprecio.NRO_DE_LIS = 10) 
              AND (carpetas.DESCRIP = 'IMPORTADO' OR carpetas.DESCRIP = 'AVIOS' OR carpetas.DESCRIP = 'OFERTAS') 
              AND articulos.PERFIL = 'A'
      ORDER BY articulos.COD_ARTICU
    `;

    const result = await pool.request().query(query);

    console.log(`Loaded ${result.recordset.length} IMPORTADO pieces`);

    return NextResponse.json({
      data: result.recordset,
      count: result.recordset.length,
      loadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error loading IMPORTADO data:", error);

    return NextResponse.json(
      { error: "Error de conexión a la base de datos" },
      { status: 500 }
    );
  } finally {
    // Close connection
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error("Error closing DB connection:", closeError);
      }
    }
  }
}
