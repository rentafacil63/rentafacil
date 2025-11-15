"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export default function DiagnosticoPage() {
  const [anio, setAnio] = useState(2024);
  const [ingresos, setIngresos] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
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

    // Lógica simple (luego metemos topes reales DIAN)
    let resultadoEnum: "SI" | "NO" | "DUDOSO" = "NO";
    let texto = "";

    if (ingresosNum > 60000000 || patrimonioNum > 200000000) {
      resultadoEnum = "SI";
      texto =
        "Según los datos ingresados, probablemente SÍ estás obligado a declarar renta.";
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
      tiene_cuentas_inversion: null,
      tiene_ingresos_laborales: null,
      tiene_ingresos_independiente: null,
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

          <Button onClick={handleCalcular} disabled={cargando}>
            {cargando ? "Calculando..." : "Calcular diagnóstico"}
          </Button>

          {resultadoTexto && (
            <p className="mt-4 font-medium">{resultadoTexto}</p>
          )}

          {mensajeGuardado && (
            <p className="mt-2 text-sm text-muted-foreground">
              {mensajeGuardado}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
