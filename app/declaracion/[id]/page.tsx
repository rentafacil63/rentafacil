"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeclaracionEstado = "borrador" | "en_revision" | "lista" | "presentada";

type Declaracion = {
  id: string;
  anio_gravable: number;
  ingresos_brutos: number | null;
  patrimonio_bruto: number | null;
  impuesto_estimado: number | null;
  saldo_favor_estimado: number | null;
  estado: DeclaracionEstado;
  created_at: string;
  updated_at: string | null;
};

export default function DeclaracionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [declaracion, setDeclaracion] = useState<Declaracion | null>(null);

  const [ingresosTexto, setIngresosTexto] = useState<string>("");
  const [patrimonioTexto, setPatrimonioTexto] = useState<string>("");
  const [estado, setEstado] = useState<DeclaracionEstado>("borrador");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // -------- helpers --------
  const textoEstado = (estado: DeclaracionEstado) => {
    switch (estado) {
      case "borrador":
        return "Borrador";
      case "en_revision":
        return "En revisión";
      case "lista":
        return "Lista para presentar";
      case "presentada":
        return "Presentada ante la DIAN";
      default:
        return estado;
    }
  };

  // LÓGICA PROVISIONAL de impuesto estimado (solo MVP, NO tarifas reales DIAN)
  const calcularImpuestoEstimado = (ingresos: number): number => {
    if (ingresos <= 0) return 0;

    let impuesto = 0;

    // Tramo 1: hasta 50M -> 0
    if (ingresos <= 50_000_000) {
      impuesto = 0;
    }
    // Tramo 2: de 50M a 100M -> 10% sobre el exceso de 50M
    else if (ingresos <= 100_000_000) {
      impuesto = (ingresos - 50_000_000) * 0.10;
    }
    // Tramo 3: de 100M en adelante -> 10% sobre 50M + 20% sobre el exceso de 100M
    else {
      impuesto =
        50_000_000 * 0.10 + (ingresos - 100_000_000) * 0.20;
    }

    return Math.max(0, Math.round(impuesto));
  };

  // -------- cargar declaración --------
  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setMensaje(null);

      // Verificar sesión
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        router.push("/login");
        return;
      }

      // Traer la declaración específica
      const { data, error } = await supabase
        .from("declaraciones")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error cargando declaración:", error);
        setMensaje("No se pudo cargar la declaración.");
      } else if (!data) {
        setMensaje("No se encontró la declaración.");
      } else {
        const dec = data as Declaracion;
        setDeclaracion(dec);

        setIngresosTexto(
          dec.ingresos_brutos != null ? dec.ingresos_brutos.toString() : ""
        );
        setPatrimonioTexto(
          dec.patrimonio_bruto != null ? dec.patrimonio_bruto.toString() : ""
        );
        setEstado(dec.estado);
      }

      setCargando(false);
    };

    if (id) {
      cargar();
    }
  }, [id, router]);

  // -------- guardar cambios + cálculo --------
  const handleCalcularYGuardar = async () => {
    if (!declaracion) return;

    setGuardando(true);
    setMensaje(null);

    const ingresosNum = ingresosTexto
      ? Number(ingresosTexto.replace(/\./g, "").replace(",", "."))
      : 0;

    const patrimonioNum = patrimonioTexto
      ? Number(patrimonioTexto.replace(/\./g, "").replace(",", "."))
      : 0;

    if (Number.isNaN(ingresosNum) || Number.isNaN(patrimonioNum)) {
      setMensaje("Por favor ingresa valores numéricos válidos.");
      setGuardando(false);
      return;
    }

    const impuestoEstimado = calcularImpuestoEstimado(ingresosNum);

    const { data, error } = await supabase
      .from("declaraciones")
      .update({
        ingresos_brutos: ingresosNum,
        patrimonio_bruto: patrimonioNum,
        impuesto_estimado: impuestoEstimado,
        // Por ahora no calculamos saldo a favor, lo dejamos en null
        estado: estado,
      })
      .eq("id", declaracion.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error guardando declaración:", error);
      setMensaje(
        "Hubo un error al guardar los cambios: " +
          (error.message ?? "")
      );
      setGuardando(false);
      return;
    }

    if (data) {
      const decActualizada = data as Declaracion;
      setDeclaracion(decActualizada);
      setIngresosTexto(
        decActualizada.ingresos_brutos != null
          ? decActualizada.ingresos_brutos.toString()
          : ""
      );
      setPatrimonioTexto(
        decActualizada.patrimonio_bruto != null
          ? decActualizada.patrimonio_bruto.toString()
          : ""
      );
      setEstado(decActualizada.estado);
    }

    setMensaje("Cambios guardados y impuesto estimado actualizado ✅");
    setGuardando(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">
            Detalle de declaración
          </h1>
          <Button variant="outline" onClick={() => router.push("/panel")}>
            Volver al panel
          </Button>
        </div>

        {cargando ? (
          <p>Cargando declaración...</p>
        ) : mensaje && !declaracion ? (
          <p className="text-sm text-red-600">{mensaje}</p>
        ) : declaracion ? (
          <>
            <div className="space-y-3 border rounded-xl p-4 bg-card">
              <p className="text-sm">
                <span className="font-medium">Año gravable:</span>{" "}
                {declaracion.anio_gravable}
              </p>

              <div className="space-y-2 mt-2">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  className="border rounded-md px-3 py-2 text-sm w-full bg-background"
                  value={estado}
                  onChange={(e) =>
                    setEstado(e.target.value as DeclaracionEstado)
                  }
                >
                  <option value="borrador">Borrador</option>
                  <option value="en_revision">En revisión</option>
                  <option value="lista">Lista para presentar</option>
                  <option value="presentada">Presentada ante la DIAN</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Estado actual: {textoEstado(estado)}
                </p>
              </div>

              <div className="space-y-2 mt-2">
                <Label htmlFor="ingresos_brutos">
                  Ingresos brutos anuales (COP)
                </Label>
                <Input
                  id="ingresos_brutos"
                  value={ingresosTexto}
                  onChange={(e) => setIngresosTexto(e.target.value)}
                  placeholder="Ej: 80.000.000"
                />
              </div>

              <div className="space-y-2 mt-2">
                <Label htmlFor="patrimonio_bruto">
                  Patrimonio bruto al 31 de diciembre (COP)
                </Label>
                <Input
                  id="patrimonio_bruto"
                  value={patrimonioTexto}
                  onChange={(e) => setPatrimonioTexto(e.target.value)}
                  placeholder="Ej: 250.000.000"
                />
              </div>

              <div className="space-y-1 mt-3">
                <p className="text-sm">
                  <span className="font-medium">Impuesto estimado:</span>{" "}
                  {declaracion.impuesto_estimado != null
                    ? declaracion.impuesto_estimado.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })
                    : "—"}
                </p>

                <p className="text-sm">
                  <span className="font-medium">
                    Saldo a favor estimado:
                  </span>{" "}
                  {declaracion.saldo_favor_estimado != null
                    ? declaracion.saldo_favor_estimado.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })
                    : "—"}
                </p>

                <p className="text-xs text-muted-foreground">
                  Creada el{" "}
                  {new Date(declaracion.created_at).toLocaleString("es-CO")}
                  {declaracion.updated_at && (
                    <>
                      {" "}
                      · Última actualización:{" "}
                      {new Date(
                        declaracion.updated_at
                      ).toLocaleString("es-CO")}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCalcularYGuardar} disabled={guardando}>
                {guardando
                  ? "Guardando cambios..."
                  : "Calcular impuesto estimado y guardar"}
              </Button>
            </div>

            {mensaje && declaracion && (
              <p className="text-sm text-muted-foreground">{mensaje}</p>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
