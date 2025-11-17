"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  FileText,
  Activity,
  Calculator,
} from "lucide-react";

import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  UVT_2024,
  evaluarObligacionRenta2024,
  calcularSaldoConRetencionesAG2024,
  type DiagnosticoBasicoEntrada,
} from "@/lib/dianTopesAg2024";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutButton";


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
};

function formatoCOP(valor: number) {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function PillPaso({ estado }: { estado: "listo" | "pendiente" }) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";

  if (estado === "listo") {
    return (
      <span className={base + " bg-emerald-50 text-emerald-700 border border-emerald-200"}>
        ● Listo
      </span>
    );
  }

  return (
    <span className={base + " bg-slate-50 text-slate-700 border border-slate-200"}>
      ● Pendiente
    </span>
  );
}

export default function HomePanelPage() {
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
        .select("renta_liquida_gravable, retenciones_fuente")
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
          Cargando tu panel...
        </p>
      </div>
    );
  }

  if (!loggedUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Para ver tu panel de Rentafacil necesitas iniciar sesión.
        </p>
        <Button asChild>
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Volver a la página principal</Link>
        </Button>
      </div>
    );
  }

  const obligado = evalObligacion?.obligado ?? false;
  const saldoAPagar = resultadoImpuesto?.saldoAPagar ?? 0;
  const saldoAFavor = resultadoImpuesto?.saldoAFavor ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
              RENTAFACIL
            </span>
            <span className="text-sm font-medium tracking-tight">
              Panel principal
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-3 text-sm font-medium">
              <Link
                href="/checklist"
                className="text-muted-foreground hover:text-foreground"
              >
                Checklist
              </Link>
              <Link
                href="/declaracion"
                className="text-muted-foreground hover:text-foreground"
              >
                Declaración
              </Link>
            </nav>

            {loggedUser && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {loggedUser.email}
              </span>
            )}

            {/* 🔹 Botón de cerrar sesión */}
      <LogoutButton />
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Bienvenida + resumen */}
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Año gravable 2024
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Hola, {loggedUser.email}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Desde aquí puedes manejar tu diagnóstico, simulación de impuesto,
              checklist y declaración preliminar del formulario 210.
            </p>
          </div>

          <Card className="md:w-64">
            <CardContent className="py-3 text-xs">
              <p className="text-[11px] font-medium text-muted-foreground mb-1">
                Estado general
              </p>
              {evalObligacion ? (
                <>
                  <p className="text-sm font-semibold">
                    {obligado
                      ? "Con los datos ingresados, estarías obligado a declarar."
                      : "No se detecta obligación de declarar con los datos actuales."}
                  </p>
                  {resultadoImpuesto && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {saldoAPagar > 0 && (
                        <>
                          Saldo estimado a pagar:{" "}
                          <span className="font-semibold text-red-600">
                            {formatoCOP(saldoAPagar)}
                          </span>
                        </>
                      )}
                      {saldoAFavor > 0 && (
                        <>
                          Posible saldo a favor:{" "}
                          <span className="font-semibold text-emerald-600">
                            {formatoCOP(saldoAFavor)}
                          </span>
                        </>
                      )}
                      {saldoAPagar === 0 && saldoAFavor === 0 && (
                        <>Aún no hay simulación de impuesto completa.</>
                      )}
                    </p>
                  )}
                  {!resultadoImpuesto && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Cuando registres tu renta líquida y retenciones, verás
                      aquí un resumen de tu impuesto estimado.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no has registrado tu diagnóstico básico. Empieza por ahí
                  para saber si debes declarar.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Acciones principales */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Diagnóstico básico */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Diagnóstico básico</span>
                <PillPaso estado={diagnostico ? "listo" : "pendiente"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-3 text-xs">
              <p className="text-muted-foreground">
                Registra tus ingresos, patrimonio, consumos, consignaciones e
                IVA para verificar si cumples los topes de la DIAN.
              </p>
              <Button size="sm" className="mt-2" asChild>
                <Link href="/diagnostico">
                  <Activity className="mr-2 h-4 w-4" />
                  Abrir diagnóstico
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Calculadora 210 */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Simulación impuesto 210</span>
                <PillPaso estado={resumen210 ? "listo" : "pendiente"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-3 text-xs">
              <p className="text-muted-foreground">
                Ingresa tu renta líquida, retenciones y, si quieres, un resumen
                de tu certificado 220 para estimar el impuesto.
              </p>
              <Button size="sm" className="mt-2" variant="outline" asChild>
                <Link href="/calculadora-210">
                  <Calculator className="mr-2 h-4 w-4" />
                  Abrir calculadora 210
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Checklist declaración</span>
                <PillPaso
                  estado={
                    diagnostico && resumen210 ? "listo" : "pendiente"
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-3 text-xs">
              <p className="text-muted-foreground">
                Revisa paso a paso qué ya completaste y qué falta antes de ver
                tu declaración preliminar.
              </p>
              <Button size="sm" className="mt-2" variant="outline" asChild>
                <Link href="/checklist">
                  <ListChecks className="mr-2 h-4 w-4" />
                  Ver checklist
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Declaración preliminar */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Declaración preliminar</span>
                <PillPaso
                  estado={
                    diagnostico && resumen210 && resultadoImpuesto
                      ? "listo"
                      : "pendiente"
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-3 text-xs">
              <p className="text-muted-foreground">
                Mira un resumen tipo Formulario 210 con la información que has
                cargado. No reemplaza el diligenciamiento en MUISCA.
              </p>
              <Button
                size="sm"
                className="mt-2"
                disabled={!diagnostico || !resumen210}
                asChild
              >
                <Link href="/declaracion">
                  <FileText className="mr-2 h-4 w-4" />
                  Ver declaración preliminar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <p className="text-[11px] text-muted-foreground">
          UVT 2024: {formatoCOP(UVT_2024)}. Esta herramienta es de orientación
          y no genera reporte automático ante la DIAN.
        </p>
      </main>
    </div>
  );
}
