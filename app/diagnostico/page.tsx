"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

type Paso = 1 | 2 | 3;

type Topes = {
  ingresos: number;
  patrimonio: number;
};

// Topes DIAN reales (valores aproximados en COP)
function obtenerTopes(anio: number): Topes {
  // Año gravable 2023 (se declara en 2024)
  if (anio === 2023) {
    return {
      ingresos: 59_377_000,   // 1.400 UVT
      patrimonio: 190_854_000 // 4.500 UVT
    };
  }

  // Año gravable 2024 (se declara en 2025)
  // Fuente DIAN AG 2024: 1.400 y 4.500 UVT. :contentReference[oaicite:1]{index=1}
  return {
    ingresos: 65_891_000,
    patrimonio: 211_793_000
  };
}

export default function DiagnosticoPage() {
  const [paso, setPaso] = useState<Paso>(1);

  const [anio, setAnio] = useState(2024);
  const [ingresos, setIngresos] = useState("");
  const [patrimonio, setPatrimonio] = useState("");

  const [tieneCuentasInv, setTieneCuentasInv] = useState<boolean | null>(null);
  const [tieneIngresosLaborales, setTieneIngresosLaborales] = useState<boolean | null>(null);
  const [tieneIngresosIndep, setTieneIngresosIndep] = useState<boolean | null>(null);

  const [resultadoEnum, setResultadoEnum] = useState<"SI" | "NO" | "DUDOSO" | null>(null);
  const [resultadoTexto, setResultadoTexto] = useState<string | null>(null);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleCalcular = async () => {
    setResultadoTexto(null);
    setMensajeGuardado(null);
    setResultadoEnum(null);
    setCargando(true);

    const ingresosNum = Number(ingresos.replace(/\./g, "").replace(",", "."));
    const patrimonioNum = Number(patrimonio.replace(/\./g, "").replace(",", "."));

    if (isNaN(ingresosNum) || isNaN(patrimonioNum)) {
      setResultadoTexto("Por favor ingresa valores numéricos válidos.");
      setCargando(false);
      return;
    }

    const topes = obtenerTopes(anio);

    // Determinar resultado usando topes reales
    let resultado: "SI" | "NO" | "DUDOSO" = "NO";
    let texto = "";

    const superaIngresos = ingresosNum >= topes.ingresos;
    const superaPatrimonio = patrimonioNum >= topes.patrimonio;

    const cercaIngresos =
      !superaIngresos && ingresosNum >= topes.ingresos * 0.9;
    const cercaPatrimonio =
      !superaPatrimonio && patrimonioNum >= topes.patrimonio * 0.9;

    if (superaIngresos || superaPatrimonio) {
      resultado = "SI";
      texto =
        "Según los topes oficiales de la DIAN para este año gravable, probablemente SÍ estás obligado a declarar renta.";
    } else if (cercaIngresos || cercaPatrimonio) {
      resultado = "DUDOSO";
      texto =
        "Estás muy cerca de los topes de obligación. Es recomendable revisar tu caso con más detalle o consultar directamente el servicio de la DIAN.";
    } else {
      resultado = "NO";
      texto =
        "Según los topes oficiales de la DIAN para este año gravable, probablemente NO estás obligado a declarar renta.";
    }

    setResultadoEnum(resultado);
    setResultadoTexto(texto);

    // Intentar guardar en Supabase si hay usuario logueado
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      setMensajeGuardado(
        "Resultado calculado. Si te registras o ingresas, podremos guardar tu diagnóstico en tu cuenta."
      );
      setCargando(false);
      return;
    }

    const user = userData.user;

    const { error: insertError } = await supabase.from("diagnosticos").insert({
      user_id: user.id,
      anio_gravable: anio,
      ingresos_brutos: ingresosNum,
      patrimonio_bruto: patrimonioNum,
      tiene_cuentas_inversion: tieneCuentasInv,
      tiene_ingresos_laborales: tieneIngresosLaborales,
      tiene_ingresos_independiente: tieneIngresosIndep,
      resultado,
      resumen: texto,
    });

    if (insertError) {
      console.error(insertError);
      setMensajeGuardado(
        "Se calculó el resultado, pero hubo un error al guardar el diagnóstico."
      );
    } else {
      setMensajeGuardado("Resultado calculado y guardado en tu cuenta ✅");
    }

    setCargando(false);
  };

  const puedeAvanzarPaso1 = anio >= 2023; // para el MVP manejamos 2023–2024
  const puedeAvanzarPaso2 = ingresos.trim() !== "" && patrimonio.trim() !== "";
  const puedeCalcular =
    puedeAvanzarPaso1 &&
    puedeAvanzarPaso2 &&
    tieneCuentasInv !== null &&
    tieneIngresosLaborales !== null &&
    tieneIngresosIndep !== null;

  const topesActuales = obtenerTopes(anio);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-6 md:p-8 space-y-6">
        {/* Encabezado + Volver al panel */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">
              Diagnóstico rápido
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              ¿Debo declarar renta en {anio}?
            </h1>
            <p className="text-sm text-slate-500">
              Responde 3 pasos sencillos y te mostramos una estimación usando los
              topes oficiales de la DIAN.
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/panel">Volver al panel</Link>
          </Button>
        </header>

        {/* Stepper */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <div className={paso >= 1 ? "text-blue-600" : ""}>1. Año gravable</div>
          <div className="flex-1 h-[1px] mx-2 bg-slate-200" />
          <div className={paso >= 2 ? "text-blue-600" : ""}>
            2. Ingresos y patrimonio
          </div>
          <div className="flex-1 h-[1px] mx-2 bg-slate-200" />
          <div className={paso >= 3 ? "text-blue-600" : ""}>
            3. Otras condiciones
          </div>
        </div>

        {/* Contenido por paso */}
        <section className="space-y-4">
          {paso === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anio">Año gravable</Label>
                <Input
                  id="anio"
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  min={2023}
                  max={2024}
                />
              </div>
              <p className="text-xs text-slate-500">
                Para esta primera versión trabajamos con los años gravables 2023 y 2024.
                Los topes se actualizan automáticamente según el año que elijas.
              </p>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingresos">Ingresos brutos anuales (COP)</Label>
                <Input
                  id="ingresos"
                  placeholder="Ej: 45.000.000"
                  value={ingresos}
                  onChange={(e) => setIngresos(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patrimonio">
                  Patrimonio bruto al 31 de dic (COP)
                </Label>
                <Input
                  id="patrimonio"
                  placeholder="Ej: 180.000.000"
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                />
              </div>

              {/* Tarjeta con topes DIAN */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-blue-700">
                  Topes DIAN para el año gravable {anio}
                </p>
                <p>
                  • Patrimonio bruto superior a{" "}
                  <span className="font-medium">
                    {topesActuales.patrimonio.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </p>
                <p>
                  • Ingresos brutos anuales iguales o superiores a{" "}
                  <span className="font-medium">
                    {topesActuales.ingresos.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </p>
                <p className="mt-1">
                  Si superas cualquiera de estos topes, entras en la zona de
                  posible obligación de declarar.
                </p>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-4">
              <PreguntaSiNo
                label="¿Tuviste cuentas de ahorro o inversión importantes durante el año?"
                valor={tieneCuentasInv}
                onChange={setTieneCuentasInv}
              />
              <PreguntaSiNo
                label="¿Recibiste ingresos como empleado (nómina)?"
                valor={tieneIngresosLaborales}
                onChange={setTieneIngresosLaborales}
              />
              <PreguntaSiNo
                label="¿Tuviste ingresos como independiente o por honorarios?"
                valor={tieneIngresosIndep}
                onChange={setTieneIngresosIndep}
              />
              <p className="text-xs text-slate-500">
                Estos datos nos ayudan a perfilar el tipo de declaración. Más
                adelante podrás ver recomendaciones personalizadas según tu perfil.
              </p>
            </div>
          )}
        </section>

        {/* Navegación de pasos */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex gap-2">
            {paso > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaso((p) => (p - 1) as Paso)}
              >
                Atrás
              </Button>
            )}
            {paso < 3 && (
              <Button
                type="button"
                onClick={() => {
                  if (paso === 1 && !puedeAvanzarPaso1) return;
                  if (paso === 2 && !puedeAvanzarPaso2) return;
                  setPaso((p) => (p + 1) as Paso);
                }}
                disabled={
                  (paso === 1 && !puedeAvanzarPaso1) ||
                  (paso === 2 && !puedeAvanzarPaso2)
                }
              >
                Siguiente
              </Button>
            )}
          </div>

          {paso === 3 && (
            <Button
              type="button"
              onClick={handleCalcular}
              disabled={!puedeCalcular || cargando}
            >
              {cargando ? "Calculando..." : "Calcular diagnóstico"}
            </Button>
          )}
        </div>

        {/* Resumen / Resultado */}
        {resultadoTexto && resultadoEnum && (
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="flex items-center gap-3">
              {resultadoEnum === "SI" && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                  <span className="font-semibold">
                    Probablemente debes declarar renta
                  </span>
                </div>
              )}
              {resultadoEnum === "NO" && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-semibold">
                    Probablemente NO estás obligado
                  </span>
                </div>
              )}
              {resultadoEnum === "DUDOSO" && (
                <div className="flex items-center gap-2 text-amber-600">
                  <HelpCircle className="w-6 h-6" />
                  <span className="font-semibold">
                    Estás cerca de los topes, revisa con más detalle
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-800">{resultadoTexto}</p>

            {mensajeGuardado && (
              <p className="text-xs text-slate-500">{mensajeGuardado}</p>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <p className="font-semibold">Resumen numérico</p>
              <p>
                Ingresos brutos declarados:{" "}
                <span className="font-medium">
                  {Number(
                    ingresos.replace(/\./g, "").replace(",", ".") || 0
                  ).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </p>
              <p>
                Patrimonio bruto declarado:{" "}
                <span className="font-medium">
                  {Number(
                    patrimonio.replace(/\./g, "").replace(",", ".") || 0
                  ).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </p>
              <p>
                Topes utilizados (año {anio}): ingresos{" "}
                <span className="font-medium">
                  {topesActuales.ingresos.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </span>{" "}
                y patrimonio{" "}
                <span className="font-medium">
                  {topesActuales.patrimonio.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </span>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Componente pequeño para las preguntas Sí/No
type PreguntaProps = {
  label: string;
  valor: boolean | null;
  onChange: (v: boolean) => void;
};

function PreguntaSiNo({ label, valor, onChange }: PreguntaProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700">{label}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={valor === true ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(true)}
        >
          Sí
        </Button>
        <Button
          type="button"
          variant={valor === false ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(false)}
        >
          No
        </Button>
      </div>
    </div>
  );
}
