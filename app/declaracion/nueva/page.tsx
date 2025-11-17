"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabaseBrowser } from "@/lib/supabaseBrowser";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  TOPE_INGRESOS_COP,
  TOPE_PATRIMONIO_COP,
  TOPE_CONSUMOS_COP,
  TOPE_CONSIGNACIONES_COP,
} from "@/lib/dianTopesAg2024";

type DiagnosticoBasicoEntrada = {
  ingresosBrutos: number;
  patrimonioBruto: number;
  comprasYConsumos: number;
  consumosTarjeta: number;
  consignaciones: number;
  responsableIVA: boolean;
};

function formatearCOP(valor: number) {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default function DeclaracionPage() {
  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState<any | null>(null);
  const [datos, setDatos] = useState<DiagnosticoBasicoEntrada | null>(null);

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

      const { data, error } = await supabaseBrowser
        .from("diagnostico_basico")
        .select("*")
        .eq("user_id", user.id)
        .eq("anio", 2024)
        .maybeSingle();

      if (!error && data) {
        setDatos({
          ingresosBrutos: Number(data.ingresos_brutos ?? 0),
          patrimonioBruto: Number(data.patrimonio_bruto ?? 0),
          comprasYConsumos: Number(data.compras_consumos ?? 0),
          consumosTarjeta: Number(data.consumos_tc ?? 0),
          consignaciones: Number(data.consignaciones ?? 0),
          responsableIVA: Boolean(data.responsable_iva ?? false),
        });
      }

      setLoading(false);
    };

    cargar();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Cargando tu información...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Un momento por favor.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loggedUser) {
    // Igual que diagnostico: pedir login
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Inicia sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Para ver tu informe de declaración, primero debes iniciar sesión.</p>
            <Button asChild className="w-full">
              <Link href="/login">Ir a iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!datos) {
    // No hay diagnóstico aún
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Aún no has diligenciado tu diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Para saber si estás obligado o no a declarar renta por el año gravable
              2024, primero necesitamos que completes tu diagnóstico básico.
            </p>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href="/diagnostico">Ir al diagnóstico</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/home">Volver al panel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cálculo de topes
  const superaIngresos = datos.ingresosBrutos >= TOPE_INGRESOS_COP;
  const superaPatrimonio = datos.patrimonioBruto >= TOPE_PATRIMONIO_COP;
  const superaConsumos = datos.comprasYConsumos >= TOPE_CONSUMOS_COP;
  const superaConsignaciones = datos.consignaciones >= TOPE_CONSIGNACIONES_COP;
  const motivos: string[] = [];

  if (superaIngresos)
    motivos.push("Superas el tope de ingresos brutos (1.400 UVT).");
  if (superaPatrimonio)
    motivos.push("Superas el tope de patrimonio bruto (4.500 UVT).");
  if (superaConsumos)
    motivos.push("Superas el tope de compras y consumos (1.400 UVT).");
  if (superaConsignaciones)
    motivos.push("Superas el tope de consignaciones / depósitos (1.400 UVT).");
  if (datos.responsableIVA)
    motivos.push("Fuiste responsable de IVA a 31 de diciembre de 2024.");

  const estaObligado = motivos.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/home" className="flex items-center gap-2">
            <span className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
              RENTAFACIL
            </span>
            <span className="text-sm font-medium tracking-tight">
              Informe de declaración AG 2024
            </span>
          </Link>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Resultado general
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Según la información que registraste para el año gravable{" "}
              <strong>2024</strong>,{" "}
              {estaObligado ? (
                <>
                  <strong>
                    todo indica que sí estás obligado a presentar declaración de
                    renta
                  </strong>{" "}
                  como persona natural.
                </>
              ) : (
                <>
                  <strong>
                    con los datos actuales no superarías los topes para estar
                    obligado
                  </strong>{" "}
                  a declarar renta.
                </>
              )}
            </p>

            {motivos.length > 0 ? (
              <div>
                <p className="mb-1 font-medium">Motivos principales:</p>
                <ul className="list-disc pl-5 text-sm">
                  {motivos.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aun así, recuerda que hay otras situaciones especiales
                (ingresos del exterior, ganancia ocasional, etc.) que pueden
                generar obligación. Este resultado es una guía inicial.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comparativo por tope */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Detalle de tus cifras vs topes DIAN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs md:text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="font-medium">Ingresos brutos 2024</p>
                <p>
                  Tus ingresos:{" "}
                  <strong>{formatearCOP(datos.ingresosBrutos)}</strong>
                </p>
                <p>
                  Tope DIAN (1.400 UVT):{" "}
                  <strong>{formatearCOP(TOPE_INGRESOS_COP)}</strong>
                </p>
              </div>

              <div>
                <p className="font-medium">Patrimonio bruto 31/12/2024</p>
                <p>
                  Tu patrimonio:{" "}
                  <strong>{formatearCOP(datos.patrimonioBruto)}</strong>
                </p>
                <p>
                  Tope DIAN (4.500 UVT):{" "}
                  <strong>{formatearCOP(TOPE_PATRIMONIO_COP)}</strong>
                </p>
              </div>

              <div>
                <p className="font-medium">Compras y consumos 2024</p>
                <p>
                  Tus compras/consumos:{" "}
                  <strong>{formatearCOP(datos.comprasYConsumos)}</strong>
                </p>
                <p>
                  Tope DIAN (1.400 UVT):{" "}
                  <strong>{formatearCOP(TOPE_CONSUMOS_COP)}</strong>
                </p>
              </div>

              <div>
                <p className="font-medium">Consignaciones / depósitos 2024</p>
                <p>
                  Tus consignaciones:{" "}
                  <strong>{formatearCOP(datos.consignaciones)}</strong>
                </p>
                <p>
                  Tope DIAN (1.400 UVT):{" "}
                  <strong>{formatearCOP(TOPE_CONSIGNACIONES_COP)}</strong>
                </p>
              </div>
            </div>

            <div className="pt-3 text-xs text-muted-foreground">
              <p>
                Nota: los valores de UVT y topes se basan en la normatividad
                para el año gravable 2024. Esta herramienta es informativa y no
                reemplaza una asesoría profesional individual.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA final */}
        <div className="flex flex-col gap-3 pb-6 md:flex-row md:justify-between">
          <Button asChild variant="outline" size="sm">
            <Link href="/diagnostico">Editar mi diagnóstico</Link>
          </Button>
          <Button asChild size="sm">
            {/* Más adelante esto puede ir a una ruta de agendamiento */}
            <Link href="/contacto">Quiero ayuda con mi declaración</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
