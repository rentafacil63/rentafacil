// app/diagnostico/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DiagnosticoPage() {
  const [anio, setAnio] = useState(2024);
  const [ingresos, setIngresos] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);

  const handleCalcular = () => {
    // Conversión básica de string con puntos/ comas a número
    const ingresosNum = Number(
      ingresos.replace(/\./g, "").replace(",", ".")
    );
    const patrimonioNum = Number(
      patrimonio.replace(/\./g, "").replace(",", ".")
    );

    if (isNaN(ingresosNum) || isNaN(patrimonioNum)) {
      setResultado("Por favor ingresa valores numéricos válidos.");
      return;
    }

    // Lógica de prueba — luego la reemplazamos por topes reales DIAN/UVT
    if (ingresosNum > 60000000 || patrimonioNum > 200000000) {
      setResultado("Según estos datos, probablemente SÍ debes declarar renta.");
    } else {
      setResultado("Según estos datos, probablemente NO estás obligado a declarar renta.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full space-y-6">
        <h1 className="text-2xl font-bold">
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
            <Label htmlFor="patrimonio">Patrimonio bruto al 31 de dic (COP)</Label>
            <Input
              id="patrimonio"
              placeholder="Ej: 180.000.000"
              value={patrimonio}
              onChange={(e) => setPatrimonio(e.target.value)}
            />
          </div>

          <Button onClick={handleCalcular}>Calcular diagnóstico</Button>

          {resultado && (
            <p className="mt-4 font-medium">
              {resultado}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
