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

type Declaracion = {
  id: string;
  anio_gravable: number;
  ingresos_brutos: number | null;
  patrimonio_bruto: number | null;
  impuesto_estimado: number | null;
  saldo_favor_estimado: number | null;
  estado: "borrador" | "en_revision" | "lista" | "presentada";
  created_at: string;
};

export default function PanelPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [declaraciones, setDeclaraciones] = useState<Declaracion[]>([]);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setMensaje(null);

      // 1. Ver usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error(userError);
        setMensaje("Error obteniendo la sesión.");
        setCargando(false);
        return;
      }

      const user = userData?.user ?? null;

      if (!user) {
        setUserEmail(null);
        setUserId(null);
        setDiagnosticos([]);
        setDeclaraciones([]);
        setCargando(false);
        return;
      }

      setUserEmail(user.email ?? null);
      setUserId(user.id);

      // 2. Traer diagnósticos del usuario
      const { data: diagData, error: diagError } = await supabase
        .from("diagnosticos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (diagError) {
        console.error(diagError);
        setMensaje("Error cargando diagnósticos.");
      } else if (diagData) {
        setDiagnosticos(diagData as Diagnostico[]);
      }

      // 3. Traer declaraciones del usuario
      const { data: declData, error: declError } = await supabase
        .from("declaraciones")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (declError) {
        console.error(declError);
        setMensaje((prev) =>
          prev
            ? prev + " También hubo error cargando declaraciones."
            : "Error cargando declaraciones."
        );
      } else if (declData) {
        setDeclaraciones(declData as Declaracion[]);
      }

      setCargando(false);
    };

    cargar();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleEliminarDiagnostico = async (id: string) => {
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

    setDiagnosticos((prev) => prev.filter((d) => d.id !== id));
  };

  const textoResultado = (resultado: Diagnostico["resultado"]) => {
    if (resultado === "SI") return "Debe declarar renta";
    if (resultado === "NO") return "No estaría obligado a declarar";
    return "Caso dudoso, requiere revisión";
  };

  const textoEstadoDeclaracion = (estado: Declaracion["estado"]) => {
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

  return (
    <main className="min-h-screen px-4 py-10 flex flex-col items-center">
      <section className="max-w-4xl w-full space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Panel de renta
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

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/diagnostico">Nuevo diagnóstico</Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/declaracion/nueva">Nueva declaración</Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/perfil">Mi perfil</Link>
            </Button>

            {userEmail && (
              <Button variant="ghost" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>

        {mensaje && <p className="text-sm text-red-600">{mensaje}</p>}

        {cargando && <p>Cargando...</p>}

        {/* Sección diagnósticos */}
        {!cargando && userEmail && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Mis diagnósticos</h2>

            {diagnosticos.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aún no tienes diagnósticos guardados. Haz tu primero desde el botón
                “Nuevo diagnóstico”.
              </p>
            ) : (
              <div className="space-y-3">
                {diagnosticos.map((d) => (
                  <div
                    key={d.id}
                    className="border rounded-xl p-4 flex flex-col gap-2 bg-card"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          Año gravable {d.anio_gravable} – {textoResultado(d.resultado)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Creado el{" "}
                          {new Date(d.created_at).toLocaleString("es-CO")}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEliminarDiagnostico(d.id)}
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
          </div>
        )}

        {/* Sección declaraciones */}
        {!cargando && userEmail && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Mis declaraciones</h2>

            {declaraciones.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aún no tienes declaraciones creadas. Puedes iniciar una desde el botón
                “Nueva declaración”.
              </p>
            ) : (
              <div className="space-y-3">
                {declaraciones.map((dec) => (
                  <div
                    key={dec.id}
                    className="border rounded-xl p-4 flex flex-col gap-2 bg-card"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          Año gravable {dec.anio_gravable} –{" "}
                          {textoEstadoDeclaracion(dec.estado)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Creada el{" "}
                          {new Date(dec.created_at).toLocaleString("es-CO")}
                        </p>
                      </div>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/declaracion/${dec.id}`}>
                          Ver detalle
                        </Link>
                      </Button>
                    </div>

                    <p className="text-sm">
                      <span className="font-medium">Ingresos brutos:</span>{" "}
                      {dec.ingresos_brutos?.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      }) ?? "—"}
                    </p>

                    <p className="text-sm">
                      <span className="font-medium">Patrimonio bruto:</span>{" "}
                      {dec.patrimonio_bruto?.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      }) ?? "—"}
                    </p>

                    {(dec.impuesto_estimado != null ||
                      dec.saldo_favor_estimado != null) && (
                      <p className="text-sm text-muted-foreground">
                        {dec.impuesto_estimado != null && (
                          <>
                            Impuesto estimado:{" "}
                            {dec.impuesto_estimado.toLocaleString("es-CO", {
                              style: "currency",
                              currency: "COP",
                              maximumFractionDigits: 0,
                            })}
                          </>
                        )}
                        {dec.impuesto_estimado != null &&
                          dec.saldo_favor_estimado != null &&
                          " · "}
                        {dec.saldo_favor_estimado != null && (
                          <>
                            Saldo a favor estimado:{" "}
                            {dec.saldo_favor_estimado.toLocaleString("es-CO", {
                              style: "currency",
                              currency: "COP",
                              maximumFractionDigits: 0,
                            })}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
