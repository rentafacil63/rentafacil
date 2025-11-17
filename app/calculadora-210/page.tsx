"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  calcularSaldoConRetencionesAG2024,
  UVT_2024,
  calcularRentaLiquidaTrabajoSimple,
} from "@/lib/dianTopesAg2024";

import { supabaseBrowser } from "@/lib/supabaseBrowser";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatearCOP(valor: number) {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

// Limpia un texto con formato de dinero y lo convierte a número.
// Acepta cosas como: "120000000", "120.000.000", "$ 120.000.000,00"
function parseMonto(valor: string): number | null {
  const trimmed = valor.trim();
  if (!trimmed) return null;

  // Elimina todo lo que no sea dígito, punto o coma (quita $, espacios, etc.)
  const soloNumeros = trimmed.replace(/[^\d.,-]/g, "");

  // Quita los puntos de miles y convierte la coma decimal en punto
  const normalizado = soloNumeros.replace(/\./g, "").replace(/,/g, ".");

  const n = Number(normalizado);
  if (!isFinite(n) || n < 0) return null;

  return n;
}

export default function Calculadora210Page() {
  const [loggedUser, setLoggedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [rentaLiquida, setRentaLiquida] = useState<string>("");
  const [retenciones, setRetenciones] = useState<string>("");

  // Campos tipo certificado 220 (rentas de trabajo)
  const [ingresos220, setIngresos220] = useState<string>("");
  const [aportes220, setAportes220] = useState<string>("");
  const [deducciones220, setDeducciones220] = useState<string>("");

  const [resultado, setResultado] = useState<
    ReturnType<typeof calcularSaldoConRetencionesAG2024> | null
  >(null);

  // Mensajes de estado
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<"ok" | "info" | "error" | null>(
    null
  );

  useEffect(() => {
    const cargar = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      setLoggedUser(user);

      if (user) {
        const { data, error } = await supabaseBrowser
          .from("renta_210_resumen")
          .select("*")
          .eq("user_id", user.id)
          .eq("anio", 2024)
          .maybeSingle();

        if (!error && data) {
          if (data.renta_liquida_gravable != null) {
            setRentaLiquida(String(Number(data.renta_liquida_gravable)));
          }
          if (data.retenciones_fuente != null) {
            setRetenciones(String(Number(data.retenciones_fuente)));
          }

          // Nuevos campos tipo certificado 220
          if (data.ingresos_laborales_brutos != null) {
            setIngresos220(String(Number(data.ingresos_laborales_brutos)));
          }
          if (data.aportes_obligatorios != null) {
            setAportes220(String(Number(data.aportes_obligatorios)));
          }
          if (data.deducciones_rentas_exentas != null) {
            setDeducciones220(String(Number(data.deducciones_rentas_exentas)));
          }

          const res = calcularSaldoConRetencionesAG2024({
            rentaLiquidaGravableCOP: Number(
              data.renta_liquida_gravable ?? 0
            ),
            retencionesEnLaFuenteCOP: Number(data.retenciones_fuente ?? 0),
          });
          setResultado(res);
        }
      }

      setLoading(false);
    };

    cargar();
  }, []);

  // 🔹 Calcular renta líquida a partir de datos tipo certificado 220
  const handleCalcularDesde220 = () => {
    setMensaje(null);
    setTipoMensaje(null);

    const ingresos = parseMonto(ingresos220);
    const aportes = parseMonto(aportes220);
    const deducciones = parseMonto(deducciones220);

    if (ingresos === null) {
      setMensaje("Ingresa un valor válido de ingresos del certificado 220.");
      setTipoMensaje("error");
      return;
    }

    if (aportes === null) {
      setMensaje("Ingresa un valor válido de aportes obligatorios.");
      setTipoMensaje("error");
      return;
    }

    if (deducciones === null) {
      setMensaje(
        "Ingresa un valor válido para deducciones y rentas exentas (puede ser 0)."
      );
      setTipoMensaje("error");
      return;
    }

    const renta = calcularRentaLiquidaTrabajoSimple({
      ingresosBrutos: ingresos,
      aportesObligatorios: aportes,
      deduccionesYRentasExentas: deducciones,
    });

    setRentaLiquida(String(Math.round(renta)));
    setMensaje(
      "Renta líquida calculada a partir de los datos tipo certificado 220."
    );
    setTipoMensaje("info");
  };

  const handleCalcularYGuardar = async () => {
    setMensaje(null);
    setTipoMensaje(null);

    // --- 1) Parseo robusto de los campos principales ---
    const rentaParsed = parseMonto(rentaLiquida);
    const retParsed = parseMonto(retenciones);

    if (rentaParsed === null) {
      setMensaje("Ingresa una renta líquida gravable válida.");
      setTipoMensaje("error");
      return;
    }

    if (retParsed === null) {
      setMensaje("Ingresa unas retenciones válidas (pueden ser 0).");
      setTipoMensaje("error");
      return;
    }

    const renta = rentaParsed;
    const ret = retParsed;

    // --- 2) Calculamos el impuesto con esos valores ---
    const res = calcularSaldoConRetencionesAG2024({
      rentaLiquidaGravableCOP: renta,
      retencionesEnLaFuenteCOP: ret,
    });
    setResultado(res);

    // --- 3) Si no hay usuario logueado, solo informamos ---
    if (!loggedUser) {
      setMensaje(
        "Cálculo realizado. Si deseas guardar esta información, inicia sesión primero."
      );
      setTipoMensaje("info");
      return;
    }

    // --- 4) Parseo opcional de los campos tipo certificado 220 ---
    const ingresos220Num = parseMonto(ingresos220);
    const aportes220Num = parseMonto(aportes220);
    const deducciones220Num = parseMonto(deducciones220);

    // Armamos el payload mínimo que siempre se guarda
    const payload: any = {
      user_id: loggedUser.id,
      anio: 2024,
      renta_liquida_gravable: renta,
      retenciones_fuente: ret,
    };

    // Solo agregamos los campos del 220 si vienen con número válido.
    // Esto evita sobreescribir con NULL lo que ya estaba en la BD.
    if (ingresos220Num !== null) {
      payload.ingresos_laborales_brutos = ingresos220Num;
    }
    if (aportes220Num !== null) {
      payload.aportes_obligatorios = aportes220Num;
    }
    if (deducciones220Num !== null) {
      payload.deducciones_rentas_exentas = deducciones220Num;
    }

    const { error } = await supabaseBrowser
      .from("renta_210_resumen")
      .upsert(payload, {
        onConflict: "user_id,anio",
      });

    if (error) {
      console.error(error);
      setMensaje("Hubo un error guardando la información en Supabase.");
      setTipoMensaje("error");
    } else {
      setMensaje("Cálculo guardado correctamente ✅");
      setTipoMensaje("ok");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Cargando información...
        </p>
      </div>
    );
  }

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
              Calculadora Formulario 210 (AG 2024)
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {loggedUser && (
              <span className="text-xs text-muted-foreground">
                {loggedUser.email}
              </span>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/home">Ir al panel</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Simulador rápido de impuesto (Formulario 210)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Ingresa tu <strong>renta líquida gravable</strong> aproximada del
              año gravable 2024 y el total de{" "}
              <strong>retenciones en la fuente</strong> que te practicaron
              (certificados 220, otros pagos). Usaremos la tabla de tarifas en
              UVT para estimar tu impuesto. UVT 2024:{" "}
              <strong>{formatearCOP(UVT_2024)}</strong>.
            </p>

            {/* Bloque opcional: datos tipo certificado 220 */}
            <div className="rounded-md border border-dashed border-slate-200 p-4 space-y-3">
              <p className="text-xs md:text-sm font-medium">
                (Opcional) Calcula la renta líquida desde tu certificado 220
              </p>
              <p className="text-[11px] text-muted-foreground">
                Si tienes tu certificado 220, puedes ingresar estos valores
                aproximados. Calcularemos una renta líquida de trabajo
                simplificada y la llevaremos al campo de "Renta líquida
                gravable (COP)".
              </p>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="ingresos220">
                    Ingresos laborales (brutos)
                  </Label>
                  <Input
                    id="ingresos220"
                    placeholder="Ej. 120.000.000"
                    value={ingresos220}
                    onChange={(e) => setIngresos220(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="aportes220">
                    Aportes obligatorios (salud + pensión)
                  </Label>
                  <Input
                    id="aportes220"
                    placeholder="Ej. 12.000.000"
                    value={aportes220}
                    onChange={(e) => setAportes220(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="deducciones220">
                    Otras deducciones y rentas exentas
                  </Label>
                  <Input
                    id="deducciones220"
                    placeholder="Ej. 15.000.000"
                    value={deducciones220}
                    onChange={(e) => setDeducciones220(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCalcularDesde220}
              >
                Usar estos datos para calcular la renta líquida
              </Button>
            </div>

            {/* Campos principales */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="renta">Renta líquida gravable (COP)</Label>
                <Input
                  id="renta"
                  placeholder="Ej. 80.000.000"
                  value={rentaLiquida}
                  onChange={(e) => setRentaLiquida(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="retenciones">
                  Retenciones en la fuente (COP)
                </Label>
                <Input
                  id="retenciones"
                  placeholder="Ej. 10.000.000"
                  value={retenciones}
                  onChange={(e) => setRetenciones(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleCalcularYGuardar}>
              Calcular impuesto
            </Button>

            {mensaje && (
              <div
                className={
                  "mt-2 rounded-md px-3 py-2 text-xs md:text-sm " +
                  (tipoMensaje === "ok"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : tipoMensaje === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border-blue-200")
                }
              >
                {mensaje}
              </div>
            )}

            {resultado && (
              <div className="mt-4 space-y-2 rounded-md bg-muted p-4 text-xs md:text-sm">
                <p>
                  Base gravable en UVT:{" "}
                  <strong>
                    {resultado.baseUVT.toLocaleString("es-CO", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    UVT
                  </strong>
                </p>
                <p>
                  Impuesto teórico calculado:{" "}
                  <strong>{formatearCOP(resultado.impuestoCOP)}</strong>
                </p>
                <p>
                  Retenciones en la fuente:{" "}
                  <strong>{formatearCOP(resultado.retencionesCOP)}</strong>
                </p>

                {resultado.saldoAPagar > 0 ? (
                  <p className="font-semibold text-red-600">
                    Saldo estimado a pagar:{" "}
                    {formatearCOP(resultado.saldoAPagar)}
                  </p>
                ) : resultado.saldoAFavor > 0 ? (
                  <p className="font-semibold text-green-600">
                    Posible saldo a favor:{" "}
                    {formatearCOP(resultado.saldoAFavor)}
                  </p>
                ) : (
                  <p className="font-semibold">
                    Sin saldo a pagar ni a favor con estos valores.
                  </p>
                )}

                <p className="pt-2 text-[11px] text-muted-foreground">
                  Esta es una simulación de orientación basada en la tabla de
                  tarifas para personas naturales residentes (Formulario 210,
                  año gravable 2024). No reemplaza el diligenciamiento en
                  MUISCA ni la revisión profesional de tu caso concreto.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
