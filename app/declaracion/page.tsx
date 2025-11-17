"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  Printer,
} from "lucide-react";

import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  UVT_2024,
  evaluarObligacionRenta2024,
  calcularSaldoConRetencionesAG2024,
  calcularRentaLiquidaTrabajoSimple,
  type DiagnosticoBasicoEntrada,
} from "@/lib/dianTopesAg2024";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DiagnosticoRow = {
  ingresos_brutos: number;
  patrimonio_bruto: number;
  compras_consumos: number;
  consumos_tc: number;
  consignaciones: number;
  responsable_iva: boolean;
};

type Resumen210Row = {
  renta_liquida_gravable: number | null;
  retenciones_fuente: number | null;
  ingresos_laborales_brutos: number | null;
  aportes_obligatorios: number | null;
  deducciones_rentas_exentas: number | null;
};

function formatoCOP(valor: number) {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function PillEstado({ tipo }: { tipo: "ok" | "warning" }) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";

  if (tipo === "ok") {
    return (
      <span className={base + " bg-emerald-50 text-emerald-700 border border-emerald-200"}>
        <CheckCircle2 className="h-3 w-3" />
        Todo en orden
      </span>
    );
  }

  return (
    <span className={base + " bg-amber-50 text-amber-800 border border-amber-200"}>
      <AlertTriangle className="h-3 w-3" />
      Obligado a declarar
    </span>
  );
}

export default function DeclaracionPage() {
  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState<any | null>(null);

  const [diagnostico, setDiagnostico] = useState<DiagnosticoRow | null>(null);
  const [resumen210, setResumen210] = useState<Resumen210Row | null>(null);
  const [evalObligacion, setEvalObligacion] = useState<
    ReturnType<typeof evaluarObligacionRenta2024> | null
  >(null);
  const [resultadoImpuesto, setResultadoImpuesto] = useState<
    ReturnType<typeof calcularSaldoConRetencionesAG2024> | null
  >(null);

  useEffect(() => {
    const cargar = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      setLoggedUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      // 1) Diagnóstico básico
      const { data: diagData } = await supabaseBrowser
        .from("diagnostico_basico")
        .select(
          "ingresos_brutos, patrimonio_bruto, compras_consumos, consumos_tc, consignaciones, responsable_iva"
        )
        .eq("user_id", user.id)
        .eq("anio", 2024)
        .maybeSingle();

      if (diagData) {
        setDiagnostico(diagData as DiagnosticoRow);

        const entrada: DiagnosticoBasicoEntrada = {
          ingresosBrutos: Number(diagData.ingresos_brutos ?? 0),
          patrimonioBruto: Number(diagData.patrimonio_bruto ?? 0),
          comprasYConsumos: Number(diagData.compras_consumos ?? 0),
          consumosTarjeta: Number(diagData.consumos_tc ?? 0),
          consignaciones: Number(diagData.consignaciones ?? 0),
          responsableIVA: Boolean(diagData.responsable_iva),
        };

        setEvalObligacion(evaluarObligacionRenta2024(entrada));
      }

      // 2) Resumen 210
      const { data: resumenData } = await supabaseBrowser
        .from("renta_210_resumen")
        .select(
          "renta_liquida_gravable, retenciones_fuente, ingresos_laborales_brutos, aportes_obligatorios, deducciones_rentas_exentas"
        )
        .eq("user_id", user.id)
        .eq("anio", 2024)
        .maybeSingle();

      if (resumenData) {
        const r = resumenData as Resumen210Row;
        setResumen210(r);

        const renta = Number(r.renta_liquida_gravable ?? 0);
        const ret = Number(r.retenciones_fuente ?? 0);

        const res = calcularSaldoConRetencionesAG2024({
          rentaLiquidaGravableCOP: renta,
          retencionesEnLaFuenteCOP: ret,
        });
        setResultadoImpuesto(res);
      }

      setLoading(false);
    };

    cargar();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Cargando tu declaración preliminar...
        </p>
      </div>
    );
  }

  if (!loggedUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Para ver el resumen de tu declaración preliminar necesitas iniciar
          sesión.
        </p>
        <Button asChild>
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  // 🧩 Caso: falta info para armar la declaración
  if (!diagnostico || !resumen210 || !resultadoImpuesto) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                RENTAFACIL
              </span>
              <span className="text-sm font-medium tracking-tight">
                Declaración preliminar (AG 2024)
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {/* correo del usuario */}
              {loggedUser && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {loggedUser.email}
                </span>
              )}

              {/* botón imprimir / PDF */}
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.print()}
              >
                <Printer className="mr-1 h-4 w-4" />
                Imprimir / PDF
              </Button>

              {/* navegación rápida */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/checklist">Checklist</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/home">Ir al panel</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Contenido: aviso de falta de info */}
        <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Falta información para armar la declaración preliminar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs md:text-sm">
              {!diagnostico && (
                <div>
                  <p className="font-medium">1. Diagnóstico básico</p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Aún no encontramos tu diagnóstico básico de topes (ingresos,
                    patrimonio, consumos, consignaciones, IVA).
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/diagnostico">Ir al diagnóstico</Link>
                  </Button>
                </div>
              )}

              {!resumen210 && (
                <div className="pt-3 border-t">
                  <p className="font-medium">
                    2. Simulación de impuesto (Formulario 210)
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Aún no encontramos tu simulación de impuesto (renta líquida
                    gravable y retenciones).
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/calculadora-210">Abrir calculadora 210</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // 🧩 Caso: sí hay todo y mostramos la declaración preliminar
  const obligado = evalObligacion?.obligado ?? false;
  const motivos = evalObligacion?.motivos;

  const {
    baseUVT,
    impuestoCOP,
    retencionesCOP,
    saldoAPagar,
    saldoAFavor,
  } = resultadoImpuesto;

  const tieneDatos220 =
    resumen210.ingresos_laborales_brutos != null ||
    resumen210.aportes_obligatorios != null ||
    resumen210.deducciones_rentas_exentas != null;

  let rentaTrabajoCalculada: number | null = null;
  if (tieneDatos220) {
    rentaTrabajoCalculada = calcularRentaLiquidaTrabajoSimple({
      ingresosBrutos: Number(resumen210.ingresos_laborales_brutos ?? 0),
      aportesObligatorios: Number(resumen210.aportes_obligatorios ?? 0),
      deduccionesYRentasExentas: Number(
        resumen210.deducciones_rentas_exentas ?? 0
      ),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          {/* Marca */}
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
              RENTAFACIL
            </span>
            <span className="text-sm font-medium tracking-tight">
              Declaración preliminar (AG 2024)
            </span>
          </Link>

          {/* Nav + usuario + imprimir */}
          <div className="flex items-center gap-2">
            {/* correo del usuario */}
            {loggedUser && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {loggedUser.email ?? "(sin email)"}
              </span>
            )}

            {/* botón imprimir / PDF */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.print()}
            >
              <Printer className="mr-1 h-4 w-4" />
              Imprimir / PDF
            </Button>

            {/* navegación rápida */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/checklist">Checklist</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/home">Ir al panel</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">
            Resumen preliminar tipo Formulario 210
          </h1>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Esta pantalla resume, con los datos que has ingresado, una
          aproximación a tu declaración de renta (Formulario 210, año gravable
          2024). No reemplaza el diligenciamiento en MUISCA ni la revisión de
          un profesional.
        </p>

        {/* 1. Estado general */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">
              1. Estado general
            </CardTitle>
            <PillEstado tipo={obligado ? "warning" : "ok"} />
          </CardHeader>
          <CardContent className="space-y-2 text-xs md:text-sm">
            {obligado ? (
              <>
                <p className="font-medium">
                  Con la información cargada, <strong>sí cumples</strong> al
                  menos uno de los topes para estar obligado a declarar renta.
                </p>
                <ul className="list-disc pl-5 text-[11px] md:text-xs text-muted-foreground space-y-1">
                  {motivos?.ingresos && (
                    <li>
                      Ingresos brutos iguales o superiores al tope establecido
                      por la DIAN.
                    </li>
                  )}
                  {motivos?.patrimonio && (
                    <li>
                      Patrimonio bruto igual o superior al tope establecido.
                    </li>
                  )}
                  {motivos?.comprasYConsumos && (
                    <li>
                      Compras y consumos (incluye tarjetas débito) iguales o
                      superiores al tope.
                    </li>
                  )}
                  {motivos?.consumosTarjeta && (
                    <li>
                      Consumos con tarjeta de crédito iguales o superiores al
                      tope.
                    </li>
                  )}
                  {motivos?.consignaciones && (
                    <li>
                      Consignaciones, depósitos o inversiones iguales o
                      superiores al tope.
                    </li>
                  )}
                  {motivos?.responsableIVA && (
                    <li>Fuiste responsable de IVA a 31 de diciembre.</li>
                  )}
                </ul>
              </>
            ) : (
              <p className="text-xs md:text-sm text-muted-foreground">
                Con el diagnóstico ingresado, no se detecta que superes los
                topes que obligan a declarar renta. Aun así, es recomendable
                revisar tu caso particular con un profesional.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 2. Resumen 210 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              2. Resumen cédula general – Formulario 210
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs md:text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">
                  Renta líquida gravable cédula general (aprox.)
                </p>
                <p className="font-semibold">
                  {formatoCOP(
                    Number(resumen210.renta_liquida_gravable ?? 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Base gravable en UVT</p>
                <p className="font-semibold">
                  {baseUVT.toLocaleString("es-CO", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  UVT
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  Impuesto sobre la renta estimado
                </p>
                <p className="font-semibold">
                  {formatoCOP(impuestoCOP)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  Retenciones en la fuente (certificados 220, otros)
                </p>
                <p className="font-semibold">
                  {formatoCOP(retencionesCOP)}
                </p>
              </div>
            </div>

            <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs md:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-slate-500" />
                {saldoAPagar > 0 ? (
                  <p className="font-semibold text-red-600">
                    Saldo estimado a pagar: {formatoCOP(saldoAPagar)}
                  </p>
                ) : saldoAFavor > 0 ? (
                  <p className="font-semibold text-emerald-600">
                    Posible saldo a favor: {formatoCOP(saldoAFavor)}
                  </p>
                ) : (
                  <p className="font-semibold">
                    Con estos valores no se proyecta saldo a pagar ni a favor.
                  </p>
                )}
              </div>
              <p className="hidden md:block text-[11px] text-muted-foreground">
                UVT 2024: {formatoCOP(UVT_2024)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Rentas de trabajo / certificado 220 */}
        {tieneDatos220 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                3. Detalle aproximado de rentas de trabajo (tipo certificado
                220)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs md:text-sm">
              <div className="grid gap-2 md:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">
                    Ingresos laborales brutos
                  </p>
                  <p className="font-semibold">
                    {formatoCOP(
                      Number(resumen210.ingresos_laborales_brutos ?? 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Aportes obligatorios (salud + pensión)
                  </p>
                  <p className="font-semibold">
                    {formatoCOP(
                      Number(resumen210.aportes_obligatorios ?? 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Otras deducciones y rentas exentas
                  </p>
                  <p className="font-semibold">
                    {formatoCOP(
                      Number(resumen210.deducciones_rentas_exentas ?? 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Renta líquida calculada (aprox.)
                  </p>
                  <p className="font-semibold">
                    {formatoCOP(Math.round(rentaTrabajoCalculada ?? 0))}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Estos valores corresponden a una lectura simplificada de tu
                certificado 220. La renta líquida calculada puede diferir de la
                que finalmente determine la DIAN al aplicar límites y
                depuraciones detalladas del Formulario 210.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="pt-2 text-[11px] text-muted-foreground">
          Esta declaración preliminar es una herramienta de orientación. No
          genera reporte automático ante la DIAN ni reemplaza el
          diligenciamiento oficial en MUISCA. Te recomendamos revisar esta
          información con tu contador o asesor de confianza.
        </p>
      </main>
    </div>
  );
}
