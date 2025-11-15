"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Diagnostico = {
  id: string;
  anio_gravable: number;
  ingresos_brutos: number | null;
  patrimonio_bruto: number | null;
  resultado: "SI" | "NO" | "DUDOSO";
  resumen: string | null;
};

export default function NuevaDeclaracionPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [ultimoDiagnostico, setUltimoDiagnostico] =
    useState<Diagnostico | null>(null);

  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [ingresos, setIngresos] = useState<string>("");
  const [patrimonio, setPatrimonio] = useState<string>("");

  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setMensaje(null);

      // 1. Usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        router.push("/login");
        return;
      }

      const user = userData.user;
      setUserEmail(user.email ?? null);
      setUserId(user.id);

      // 2. Último diagnóstico del usuario (si existe)
      const { data: diagData, error: diagError } = await supabase
        .from("diagnosticos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (diagError) {
        console.error("Error cargando último diagnóstico:", diagError);
        setMensaje("No se pudo cargar tu último diagnóstico.");
      } else if (diagData) {
        const d = diagData as Diagnostico;
        setUltimoDiagnostico(d);
        setAnio(d.anio_gravable);
        setIngresos(
          d.ingresos_brutos != null
            ? d.ingresos_brutos.toString()
            : ""
        );
        setPatrimonio(
          d.patrimonio_bruto != null
            ? d.patrimonio_bruto.toString()
            : ""
        );
      }

      setCargando(false);
    };

    cargar();
  }, [router]);

  const handleCrearDeclaracion = async () => {
    if (!userId) return;

    setCreando(true);
    setMensaje(null);

    const ingresosNum = ingresos
      ? Number(ingresos.replace(/\./g, "").replace(",", "."))
      : null;
    const patrimonioNum = patrimonio
      ? Number(patrimonio.replace(/\./g, "").replace(",", "."))
      : null;

    const { data, error } = await supabase
      .from("declaraciones")
      .insert({
        user_id: userId,
        diagnostico_id: ultimoDiagnostico?.id ?? null,
        anio_gravable: anio,
        ingresos_brutos: ingresosNum,
        patrimonio_bruto: patrimonioNum,
        estado: "borrador",
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error creando declaración:", error);
      setMensaje(
        "Hubo un error al crear el borrador de tu declaración: " +
          (error.message ?? "")
      );
      setCreando(false);
      return;
    }

    setMensaje("Borrador de declaración creado correctamente ✅");

    // Por ahora, te devuelvo al panel.
    // Más adelante haremos /declaracion/[id] para editarla a detalle.
    if (data) {
      setTimeout(() => {
        router.push("/panel");
      }, 1000);
    } else {
      setCreando(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">
            Nueva declaración de renta
          </h1>
          {userEmail && (
            <p className="text-sm text-muted-foreground">
              Sesión iniciada como{" "}
              <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>

        {cargando ? (
          <p>Cargando datos...</p>
        ) : (
          <div className="space-y-4">
            {ultimoDiagnostico ? (
              <p className="text-sm text-muted-foreground">
                Usaremos como base tu último diagnóstico del año{" "}
                <span className="font-medium">
                  {ultimoDiagnostico.anio_gravable}
                </span>
                . Luego podrás ajustar los valores en el proceso de declaración
                completa.
              </p>
            ) : (
              <p className="text-sm text-yellow-700">
                Aún no tienes diagnóstico guardado. Puedes crear la declaración
                desde cero o, si lo prefieres, primero hacer un diagnóstico.
              </p>
            )}

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
              <Label htmlFor="ingresos">
                Ingresos brutos anuales (COP) para la declaración
              </Label>
              <Input
                id="ingresos"
                value={ingresos}
                onChange={(e) => setIngresos(e.target.value)}
                placeholder="Ej: 60.000.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patrimonio">
                Patrimonio bruto al 31 de dic (COP)
              </Label>
              <Input
                id="patrimonio"
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value)}
                placeholder="Ej: 200.000.000"
              />
            </div>

            <Button
              onClick={handleCrearDeclaracion}
              disabled={creando}
            >
              {creando ? "Creando borrador..." : "Crear borrador de declaración"}
            </Button>

            {mensaje && (
              <p className="text-sm text-muted-foreground mt-2">
                {mensaje}
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/panel")}
            >
              Volver al panel
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
