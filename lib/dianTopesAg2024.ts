// src/lib/dianTopesAg2024.ts

// UVT de referencia para año gravable 2024
export const UVT_2024 = 47_065;

// Topes en UVT (AG 2024, se declara en 2025)
export const TOPE_INGRESOS_UVT = 1_400;
export const TOPE_PATRIMONIO_UVT = 4_500;
export const TOPE_CONSUMOS_UVT = 1_400;
export const TOPE_CONSIGNACIONES_UVT = 1_400;

// Topes en pesos (COP)
export const TOPE_INGRESOS_COP = UVT_2024 * TOPE_INGRESOS_UVT; // 65.891.000 aprox
export const TOPE_PATRIMONIO_COP = UVT_2024 * TOPE_PATRIMONIO_UVT; // 211.792.500 aprox
export const TOPE_CONSUMOS_COP = UVT_2024 * TOPE_CONSUMOS_UVT; // 65.891.000 aprox
export const TOPE_CONSIGNACIONES_COP =
  UVT_2024 * TOPE_CONSIGNACIONES_UVT; // 65.891.000 aprox

// ----------------- Diagnóstico de obligación de declarar -----------------

export type DiagnosticoBasicoEntrada = {
  ingresosBrutos: number; // todo el año 2024
  patrimonioBruto: number; // al 31 de diciembre 2024
  comprasYConsumos: number; // compras + gastos + consumos 2024
  consumosTarjeta: number; // consumos con TC 2024
  consignaciones: number; // consignaciones + depósitos + inversiones 2024
  responsableIVA: boolean; // si fue responsable de IVA a 31/12/2024
};

export type EvaluacionObligacionRenta = {
  obligado: boolean;
  motivos: {
    ingresos: boolean;
    patrimonio: boolean;
    comprasYConsumos: boolean;
    consumosTarjeta: boolean;
    consignaciones: boolean;
    responsableIVA: boolean;
  };
};

export function evaluarObligacionRenta2024(
  entrada: DiagnosticoBasicoEntrada
): EvaluacionObligacionRenta {
  const motivos = {
    ingresos: entrada.ingresosBrutos >= TOPE_INGRESOS_COP,
    patrimonio: entrada.patrimonioBruto >= TOPE_PATRIMONIO_COP,
    comprasYConsumos: entrada.comprasYConsumos >= TOPE_CONSUMOS_COP,
    consumosTarjeta: entrada.consumosTarjeta >= TOPE_CONSUMOS_COP,
    consignaciones: entrada.consignaciones >= TOPE_CONSIGNACIONES_COP,
    responsableIVA: entrada.responsableIVA,
  };

  const obligado = Object.values(motivos).some(Boolean);

  return { obligado, motivos };
}

// ----------------- Cálculo impuesto 210 (cédula general, AG 2024) -----------------

// Convierte COP ↔ UVT
export function convertirCOPaUVT(valorCop: number): number {
  return valorCop / UVT_2024;
}

export function convertirUVTaCOP(valorUVT: number): number {
  return valorUVT * UVT_2024;
}

/**
 * Calcula el impuesto sobre la renta (cédula general) para personas naturales residentes,
 * usando la tabla de tarifas en UVT vigente para el año gravable 2024.
 */
export function calcularImpuestoCedulaGeneralAG2024(
  rentaLiquidaGravableCOP: number
): {
  baseUVT: number;
  impuestoUVT: number;
  impuestoCOP: number;
} {
  const baseUVT = convertirCOPaUVT(Math.max(0, rentaLiquidaGravableCOP));
  let impuestoUVT = 0;

  // Tabla en UVT (AG 2024, personas naturales residentes)
  //
  // 0 – 1.090 UVT         → 0%
  // >1.090 – 1.700 UVT    → (R - 1.090) * 19%
  // >1.700 – 4.100 UVT    → (R - 1.700) * 28% + 116
  // >4.100 – 8.670 UVT    → (R - 4.100) * 33% + 788
  // >8.670 – 18.970 UVT   → (R - 8.670) * 35% + 2.296
  // >18.970 – 31.000 UVT  → (R - 18.970) * 37% + 5.901
  // >31.000 UVT           → (R - 31.000) * 39% + 10.352

  if (baseUVT <= 1_090) {
    impuestoUVT = 0;
  } else if (baseUVT <= 1_700) {
    impuestoUVT = (baseUVT - 1_090) * 0.19;
  } else if (baseUVT <= 4_100) {
    impuestoUVT = (baseUVT - 1_700) * 0.28 + 116;
  } else if (baseUVT <= 8_670) {
    impuestoUVT = (baseUVT - 4_100) * 0.33 + 788;
  } else if (baseUVT <= 18_970) {
    impuestoUVT = (baseUVT - 8_670) * 0.35 + 2_296;
  } else if (baseUVT <= 31_000) {
    impuestoUVT = (baseUVT - 18_970) * 0.37 + 5_901;
  } else {
    impuestoUVT = (baseUVT - 31_000) * 0.39 + 10_352;
  }

  const impuestoCOP = convertirUVTaCOP(impuestoUVT);

  return {
    baseUVT,
    impuestoUVT,
    impuestoCOP,
  };
}

/**
 * Dada una renta líquida gravable y las retenciones en la fuente,
 * calcula el saldo a pagar o saldo a favor para AG 2024 (cédula general).
 */
export function calcularSaldoConRetencionesAG2024(params: {
  rentaLiquidaGravableCOP: number;
  retencionesEnLaFuenteCOP: number;
}): {
  baseUVT: number;
  impuestoCOP: number;
  retencionesCOP: number;
  saldoAPagar: number;
  saldoAFavor: number;
} {
  const { rentaLiquidaGravableCOP, retencionesEnLaFuenteCOP } = params;

  const { baseUVT, impuestoCOP } =
    calcularImpuestoCedulaGeneralAG2024(rentaLiquidaGravableCOP);

  const retenciones = Math.max(0, retencionesEnLaFuenteCOP);
  const diferencia = impuestoCOP - retenciones;

  const saldoAPagar = diferencia > 0 ? diferencia : 0;
  const saldoAFavor = diferencia < 0 ? Math.abs(diferencia) : 0;

  return {
    baseUVT,
    impuestoCOP,
    retencionesCOP: retenciones,
    saldoAPagar,
    saldoAFavor,
  };
}

// ----------------- Renta de trabajo (versión simplificada) -----------------

/**
 * Cálculo simplificado de renta líquida de trabajo a partir de algo similar
 * al certificado 220:
 *
 * renta líquida ≈ ingresos brutos - aportes obligatorios - (deducciones + rentas exentas)
 *
 * ⚠️ Es solo una aproximación para simulación, no reemplaza el cálculo
 * detallado del Formulario 210 ni la aplicación de límites específicos de la DIAN.
 */
export function calcularRentaLiquidaTrabajoSimple(params: {
  ingresosBrutos: number; // ingresos laborales certificados
  aportesObligatorios: number; // salud + pensión obligatoria
  deduccionesYRentasExentas: number; // otras deducciones + rentas exentas (total)
}): number {
  const ingresos = Math.max(0, params.ingresosBrutos || 0);
  const aportes = Math.max(0, params.aportesObligatorios || 0);
  const deducciones = Math.max(0, params.deduccionesYRentasExentas || 0);

  const rentaLiquida = ingresos - aportes - deducciones;
  return rentaLiquida > 0 ? rentaLiquida : 0;
}
