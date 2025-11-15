"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const anioActual = new Date().getFullYear();

export default function DiagnosticoPage() {
  const [anio, setAnio] = useState(anioActual);
  const [ingresos, setIngresos] = useState("");
  const [patrimonio, setPatrimonio] = useState("");

  const [tieneIngresosLaborales, setTieneIngresosLaborales] = useState(false);
  const [tieneIngresosIndependiente, setTieneIngresosIndependiente] =
    useState(false);
  const [tieneCuentasInversion, setTieneCuentasInversion] = useState(false);

  const [resultadoTexto, setResultadoTexto] = useState<string | null>(null);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleCalcular = async () => {
    setResultadoTexto(null);
    setMensajeGuardado(null);
    setCargando(true);

    const ingresosNum = Number(
      ingresos.replace(/\./g, "").replace(",", ".")
    );
    const patrimonioNum = Number(
      patrimonio.replace(/\./g, "").replace(",", ".")
    );

    if (isNaN(ingresosNum) || isNaN(patrimonioNum)) {
      setResultadoTexto("Por favor ingresa valores numéricos válidos.");
      setCargando(false);
      return;
    }

    // --- Lógica simple de MVP (luego afinamos con topes reales DIAN) ---
    let resultadoEnum: "SI" | "NO" | "DUDOSO" = "NO";
    let texto = "";

    const cercaIngresos = ingresosNum > 50_000_000 && ingresosNum <= 60_000_000;
    const cercaPatrimonio =
      patrimonioNum > 180_000_000 && patrimonioNum <= 200_000_000;

    if (ingresosNum > 60_000_000 || patrimonioNum > 200_000_000) {
      resultadoEnum = "SI";
      texto =
        "Según los datos ingresados, probablemente SÍ estás obligado a declarar renta.";
    } else if (
      cercaIngresos ||
      cercaPatrimonio ||
      tieneIngresosIndependiente ||
      tieneCuentasInversion
    ) {
      resultadoEnum = "DUDOSO";
      texto =
        "Por los datos ingresados estás cerca de los topes o tienes situaciones que conviene revisar con detalle. Te recomendamos una revisión completa de tu declaración.";
    } else {
      resultadoEnum = "NO";
      texto =
        "Según los datos ingresados, probablemente NO estás obligado a declarar renta.";
    }

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
      tiene_cuentas_inversion: tieneCuentasInversion,
      tiene_ingresos_laborales: tieneIngresosLaborales,
      tiene_ingresos_independiente: tieneIngresosIndependiente,
      resultado: resultadoEnum,
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

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          Diagnóstico: ¿Debo declarar renta en {anio}?
        </h1>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anio">Año gravable</Label>
            <Input
              id="anio"
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            />
          </div>

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

          {/* Preguntas adicionales del diagnóstico 2.0 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Marca lo que aplique a tu caso:
            </p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tieneIngresosLaborales}
                onChange={(e) => setTieneIngresosLaborales(e.target.checked)}
              />
              <span>Tuviste ingresos como empleado (salarios)</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tieneIngresosIndependiente}
                onChange={(e) =>
                  setTieneIngresosIndependiente(e.target.checked)
                }
              />
              <span>Tuviste ingresos como independiente / honorarios</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tieneCuentasInversion}
                onChange={(e) => setTieneCuentasInversion(e.target.checked)}
              />
              <span>
                Tienes cuentas de ahorro, CDT u otras inversiones financieras
              </span>
            </label>
          </div>

          <Button onClick={handleCalcular} disabled={cargando}>
            {cargando ? "Calculando..." : "Calcular diagnóstico"}
          </Button>

          {resultadoTexto && (
            <p className="mt-4 font-medium">{resultadoTexto}</p>
          )}

          {mensajeGuardado && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-muted-foreground">
                {mensajeGuardado}
              </p>

              {mensajeGuardado.includes("guardado") && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/panel">Ver mis diagnósticos</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
