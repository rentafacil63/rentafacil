"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  FileText,
  ListChecks,
} from "lucide-react";

import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  evaluarObligacionRenta2024,
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

function PillEstado({
  estado,
}: {
  estado: "ok" | "pendiente" | "warning";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";

  if (estado === "ok") {
    return (
      <span className={base + " bg-emerald-50 text-emerald-700 border border-emerald-200"}>
        <CheckCircle2 className="h-3 w-3" />
        Listo
      </span>
    );
  }

  if (estado === "warning") {
    return (
      <span className={base + " bg-amber-50 text-amber-800 border border-amber-200"}>
        <AlertTriangle className="h-3 w-3" />
        Importante
      </span>
    );
  }

  return (
    <span className={base + " bg-slate-50 text-slate-700 border border-slate-200"}>
      <CircleDashed className="h-3 w-3" />
      Pendiente
    </span>
  );
}

export default function ChecklistPage() {
  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState<any | null>(null);

  const [diagnostico, setDiagnostico] = useState<DiagnosticoRow | null>(null);
  const [resumen210, setResumen210] = useState<Resumen210Row | null>(null);
  const [evalObligacion, setEvalObligacion] = useState<
    ReturnType<typeof evaluarObligacionRenta2024> | null
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

      // Diagnóstico básico
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

      // Resumen 210
      const { data: resumenData } = await supabaseBrowser
        .from("renta_210_resumen")
        .select(
          "renta_liquida_gravable, retenciones_fuente, ingresos_laborales_brutos, aportes_obligatorios, deducciones_rentas_exentas"
        )
        .eq("user_id", user.id)
        .eq("anio", 2024)
        .maybeSingle();

      if (resumenData) {
        setResumen210(resumenData as Resumen210Row);
      }

      setLoading(false);
    };

    cargar();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Cargando tu checklist...
        </p>
      </div>
    );
  }

  if (!loggedUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Para ver el checklist de tu declaración de renta necesitas iniciar
          sesión.
        </p>
        <Button asChild>
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  // Estados derivados
  const tieneDiagnostico = Boolean(diagnostico);
  const obligado = evalObligacion?.obligado ?? false;
  const tieneResumen210 = Boolean(
    resumen210 && resumen210.renta_liquida_gravable != null
  );
  const tieneDatos220 = Boolean(
    resumen210 &&
      (resumen210.ingresos_laborales_brutos != null ||
        resumen210.aportes_obligatorios != null ||
        resumen210.deducciones_rentas_exentas != null)
  );

  const puedeVerDeclaracion = tieneDiagnostico && tieneResumen210;

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
              Checklist de tu declaración (AG 2024)
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {loggedUser.email}
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/home">Ir al panel</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">
            Pasos para tu declaración de renta 2024
          </h1>
        </div>

        <p className="text-xs md:text-sm text-muted-foreground">
          Aquí ves, en forma de checklist, qué pasos ya completaste y cuáles
          están pendientes antes de revisar tu declaración preliminar
          (Formulario 210).
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Resumen rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs md:text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">1. Diagnóstico básico</p>
                <p className="text-[11px] text-muted-foreground">
                  Revisamos si cumples los topes de la DIAN (ingresos, patrimonio,
                  consumos, consignaciones, IVA).
                </p>
              </div>
              <PillEstado estado={tieneDiagnostico ? "ok" : "pendiente"} />
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-2">
              <div>
                <p className="font-medium">2. Obligación de declarar</p>
                <p className="text-[11px] text-muted-foreground">
                  Con base en tu diagnóstico básico.
                </p>
              </div>
              {tieneDiagnostico ? (
                <PillEstado estado={obligado ? "warning" : "ok"} />
              ) : (
                <PillEstado estado="pendiente" />
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-2">
              <div>
                <p className="font-medium">
                  3. Simulación de impuesto (Formulario 210)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Renta líquida gravable y retenciones en la fuente.
                </p>
              </div>
              <PillEstado estado={tieneResumen210 ? "ok" : "pendiente"} />
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-2">
              <div>
                <p className="font-medium">
                  4. Rentas de trabajo / certificado 220
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ingresos laborales, aportes y deducciones (opcional pero
                  recomendado).
                </p>
              </div>
              <PillEstado estado={tieneDatos220 ? "ok" : "pendiente"} />
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-2">
              <div>
                <p className="font-medium">
                  5. Revisar declaración preliminar
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ver un resumen tipo Formulario 210 con tus datos actuales.
                </p>
              </div>
              <PillEstado
                estado={puedeVerDeclaracion ? "ok" : "pendiente"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Acciones / atajos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              ¿Qué te conviene hacer ahora?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs md:text-sm">
            {!tieneDiagnostico && (
              <div className="flex items-start gap-3 rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium">
                    Primero llena el diagnóstico básico
                  </p>
                  <p className="text-[11px] text-amber-900">
                    Con esa información sabremos si la DIAN te exige declarar
                    renta o no.
                  </p>
                  <div className="mt-2">
                    <Button size="sm" asChild>
                      <Link href="/diagnostico">Ir al diagnóstico</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {tieneDiagnostico && !tieneResumen210 && (
              <div className="flex items-start gap-3 rounded-md border-l-4 border-sky-400 bg-sky-50 px-3 py-2">
                <FileText className="mt-0.5 h-4 w-4 text-sky-600" />
                <div>
                  <p className="font-medium">
                    Ya puedes estimar tu impuesto en la calculadora 210
                  </p>
                  <p className="text-[11px] text-sky-900">
                    Usa la renta líquida aproximada y las retenciones en la
                    fuente para ver si te da saldo a pagar o a favor.
                  </p>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/calculadora-210">
                        Abrir calculadora 210
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {tieneResumen210 && !puedeVerDeclaracion && (
              <p className="text-[11px] text-muted-foreground">
                Cuando completes el diagnóstico y la simulación de impuesto,
                podrás ver una declaración preliminar con todos los datos
                consolidados.
              </p>
            )}

            {puedeVerDeclaracion && (
              <div className="flex items-start gap-3 rounded-md border-l-4 border-emerald-400 bg-emerald-50 px-3 py-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-medium">
                    Ya puedes revisar tu declaración preliminar
                  </p>
                  <p className="text-[11px] text-emerald-900">
                    Verás un resumen tipo Formulario 210, con la simulación de
                    impuesto y tus datos clave.
                  </p>
                  <div className="mt-2">
                    <Button size="sm" asChild>
                      <Link href="/declaracion">Ver declaración preliminar</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ListChecks className="h-3 w-3" />
                Este checklist es solo informativo. No reemplaza tu declaración
                oficial en MUISCA.
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
