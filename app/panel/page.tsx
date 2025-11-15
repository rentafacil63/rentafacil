// app/panel/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Diagnostico = {
  id: string;
  anio_gravable: number;
  ingresos_brutos: number | null;
  patrimonio_bruto: number | null;
  resultado: "SI" | "NO" | "DUDOSO";
  resumen: string | null;
  created_at: string;
};

export default function PanelPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);

      // 1. Ver usuario actual
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user ?? null;

      if (!user) {
        setUserEmail(null);
        setDiagnosticos([]);
        setCargando(false);
        return;
      }

      setUserEmail(user.email ?? null);

      // 2. Traer diagnósticos del usuario
      const { data, error } = await supabase
        .from("diagnosticos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setMensaje("Error cargando diagnósticos.");
      } else if (data) {
        setDiagnosticos(data as Diagnostico[]);
      }

      setCargando(false);
    };

    cargar();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleEliminar = async (id: string) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este diagnóstico? Esta acción no se puede deshacer."
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from("diagnosticos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Hubo un error al eliminar el diagnóstico.");
      return;
    }

    // Actualizar estado en memoria
    setDiagnosticos((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <main className="min-h-screen px-4 py-10 flex flex-col items-center">
      <section className="max-w-4xl w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Mis diagnósticos de renta
            </h1>
            {userEmail ? (
              <p className="text-sm text-muted-foreground">
                Sesión iniciada como{" "}
                <span className="font-medium">{userEmail}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No has iniciado sesión.{" "}
                <Link href="/login" className="underline">
                  Inicia sesión aquí
                </Link>
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/diagnostico">Nuevo diagnóstico</Link>
            </Button>
            {userEmail && (
              <Button variant="ghost" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>

        {mensaje && (
          <p className="text-sm text-red-600">
            {mensaje}
          </p>
        )}

        {cargando && <p>Cargando...</p>}

        {!cargando && userEmail && diagnosticos.length === 0 && (
          <p className="text-muted-foreground">
            Aún no tienes diagnósticos guardados. Haz tu primero desde el botón
            “Nuevo diagnóstico”.
          </p>
        )}

        {!cargando && userEmail && diagnosticos.length > 0 && (
          <div className="space-y-3">
            {diagnosticos.map((d) => (
              <div
                key={d.id}
                className="border rounded-xl p-4 flex flex-col gap-2 bg-card"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      Año gravable {d.anio_gravable} –{" "}
                      {d.resultado === "SI"
                        ? "Debe declarar"
                        : "No obligado a declarar"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Creado el{" "}
                      {new Date(d.created_at).toLocaleString("es-CO")}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEliminar(d.id)}
                  >
                    Eliminar
                  </Button>
                </div>

                <p className="text-sm">
                  <span className="font-medium">Ingresos brutos:</span>{" "}
                  {d.ingresos_brutos?.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  }) ?? "—"}
                </p>

                <p className="text-sm">
                  <span className="font-medium">Patrimonio bruto:</span>{" "}
                  {d.patrimonio_bruto?.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  }) ?? "—"}
                </p>

                {d.resumen && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {d.resumen}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
