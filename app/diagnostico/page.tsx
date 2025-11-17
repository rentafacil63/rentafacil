"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

import { supabaseBrowser } from "@/lib/supabaseBrowser";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackToDashboardButton } from "@/components/BackToDashboardButton";

type FormState = {
  ingresosBrutos: string;
  patrimonioBruto: string;
  comprasYConsumos: string;
  consumosTarjeta: string;
  consignaciones: string;
  responsableIVA: boolean;
};

export default function DiagnosticoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    ingresosBrutos: "",
    patrimonioBruto: "",
    comprasYConsumos: "",
    consumosTarjeta: "",
    consignaciones: "",
    responsableIVA: false,
  });
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos existentes al entrar
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
        setRowId(data.id as string);
        setForm({
          ingresosBrutos: data.ingresos_brutos?.toString() ?? "",
          patrimonioBruto: data.patrimonio_bruto?.toString() ?? "",
          comprasYConsumos: data.compras_consumos?.toString() ?? "",
          consumosTarjeta: data.consumos_tc?.toString() ?? "",
          consignaciones: data.consignaciones?.toString() ?? "",
          responsableIVA: !!data.responsable_iva,
        });
      }

      setLoading(false);
    };

    cargar();
  }, []);

  const handleChange =
    (campo: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        campo === "responsableIVA" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [campo]: value as any }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    if (!loggedUser) {
      setError("Debes iniciar sesión para guardar tu diagnóstico.");
      return;
    }

    setSaving(true);

    const payload = {
      user_id: loggedUser.id,
      anio: 2024,
      ingresos_brutos: Number(form.ingresosBrutos || 0),
      patrimonio_bruto: Number(form.patrimonioBruto || 0),
      compras_consumos: Number(form.comprasYConsumos || 0),
      consumos_tc: Number(form.consumosTarjeta || 0),
      consignaciones: Number(form.consignaciones || 0),
      responsable_iva: form.responsableIVA,
    };

    try {
      if (rowId) {
        // Actualizar registro existente
        const { error: updateError } = await supabaseBrowser
          .from("diagnostico_basico")
          .update(payload)
          .eq("id", rowId);

        if (updateError) throw updateError;
      } else {
        // Insertar nuevo registro
        const { data, error: insertError } = await supabaseBrowser
          .from("diagnostico_basico")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) throw insertError;
        if (data?.id) setRowId(data.id as string);
      }

      setMensaje("Diagnóstico guardado correctamente ✅");
    } catch (err: any) {
      console.error(err);
      setError(
        "Ocurrió un error al guardar. Revisa la consola para más detalle."
      );
    } finally {
      setSaving(false);
    }
  };

  // Estados especiales
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Cargando diagnóstico...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Por favor espera un momento.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loggedUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Inicia sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Para diligenciar tu diagnóstico, primero debes iniciar sesión.</p>
            <Button asChild className="w-full">
              <Link href="/login">Ir a iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista principal con el formulario
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/home" className="flex items-center gap-2">
            <span className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
              RENTAFACIL
            </span>
            <span className="text-sm font-medium tracking-tight">
              Diagnóstico AG 2024
            </span>
          </Link>

          <BackToDashboardButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Completa tu información básica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <p className="text-sm text-muted-foreground">
                Todos los valores son para el año gravable{" "}
                <strong>2024</strong>. Ingresa los montos aproximados en pesos
                colombianos (COP).
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ingresosBrutos">Ingresos brutos 2024</Label>
                  <Input
                    id="ingresosBrutos"
                    type="number"
                    min={0}
                    step={100000}
                    value={form.ingresosBrutos}
                    onChange={handleChange("ingresosBrutos")}
                    placeholder="Ej: 70000000"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Suma de todos tus ingresos del año (salario, honorarios,
                    arriendos, etc.).
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="patrimonioBruto">
                    Patrimonio bruto al 31/12/2024
                  </Label>
                  <Input
                    id="patrimonioBruto"
                    type="number"
                    min={0}
                    step={1000000}
                    value={form.patrimonioBruto}
                    onChange={handleChange("patrimonioBruto")}
                    placeholder="Ej: 200000000"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Patrimonio total (inmuebles, vehículos, cuentas, CDT, etc.).
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="comprasYConsumos">
                    Compras y consumos 2024
                  </Label>
                  <Input
                    id="comprasYConsumos"
                    type="number"
                    min={0}
                    step={100000}
                    value={form.comprasYConsumos}
                    onChange={handleChange("comprasYConsumos")}
                    placeholder="Ej: 50000000"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Gastos y consumos totales (no solo con tarjeta).
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="consumosTarjeta">
                    Consumos con tarjeta 2024
                  </Label>
                  <Input
                    id="consumosTarjeta"
                    type="number"
                    min={0}
                    step={100000}
                    value={form.consumosTarjeta}
                    onChange={handleChange("consumosTarjeta")}
                    placeholder="Ej: 12000000"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Compras pagadas con tarjeta de crédito en todo el año.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="consignaciones">
                    Consignaciones / depósitos 2024
                  </Label>
                  <Input
                    id="consignaciones"
                    type="number"
                    min={0}
                    step={100000}
                    value={form.consignaciones}
                    onChange={handleChange("consignaciones")}
                    placeholder="Ej: 70000000"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Suma de consignaciones, depósitos e inversiones en bancos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="responsableIVA"
                  type="checkbox"
                  checked={form.responsableIVA}
                  onChange={handleChange("responsableIVA")}
                  className="h-4 w-4"
                />
                <Label
                  htmlFor="responsableIVA"
                  className="text-sm font-normal"
                >
                  Fui responsable de IVA a 31 de diciembre de 2024
                </Label>
              </div>

              {mensaje && (
                <p className="text-sm text-emerald-600">{mensaje}</p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar diagnóstico"}
                </Button>

                <Button variant="ghost" size="sm" asChild>
                  <Link href="/home">Volver al panel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
