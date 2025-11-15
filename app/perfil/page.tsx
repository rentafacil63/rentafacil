"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type TipoDocumento = {
  id: string;
  codigo: string;
  nombre: string;
  requiere_dv: boolean | null;
};

export default function PerfilPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [tipoDocumentoId, setTipoDocumentoId] = useState<string>("");

  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Cargar catálogo de tipos de documento
  const cargarTiposDocumento = async () => {
    const { data, error } = await supabase
      .from("tipo_documentos")
      .select("id,codigo,nombre,requiere_dv")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) {
      console.error("Error cargando tipos de documento:", error);
      setMensaje("No se pudieron cargar los tipos de documento.");
      return;
    }

    setTiposDocumento(data as TipoDocumento[]);
  };

  // Cargar perfil del usuario
  const cargarPerfilDesdeDB = async (uid: string) => {
    const { data: perfilData, error: perfilError } = await supabase
      .from("perfil")
      .select("nombre,documento,tipo_documento_id")
      .eq("id", uid)
      .maybeSingle();

    if (perfilError) {
      console.error("Error cargando perfil:", perfilError);
      setMensaje("No se pudo cargar tu perfil.");
      return;
    }

    if (perfilData) {
      setNombre(perfilData.nombre ?? "");
      setDocumento(perfilData.documento ?? "");
      setTipoDocumentoId(perfilData.tipo_documento_id ?? "");
    } else {
      setNombre("");
      setDocumento("");
      setTipoDocumentoId("");
    }
  };

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

      // 2. Catálogo de tipos
      await cargarTiposDocumento();

      // 3. Perfil
      await cargarPerfilDesdeDB(user.id);

      setCargando(false);
    };

    cargar();
  }, [router]);

  const handleGuardar = async () => {
    if (!userId) return;

    if (!tipoDocumentoId) {
      setMensaje("Por favor selecciona un tipo de documento.");
      return;
    }

    setGuardando(true);
    setMensaje(null);

    const { data, error } = await supabase
      .from("perfil")
      .upsert(
        {
          id: userId,
          nombre,
          documento,
          tipo_documento_id: tipoDocumentoId,
        },
        { onConflict: "id" }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error guardando perfil:", error);
      setMensaje(
        "Hubo un error al guardar tu perfil: " + (error.message ?? "")
      );
      setGuardando(false);
      return;
    }

    if (data) {
      setNombre(data.nombre ?? "");
      setDocumento(data.documento ?? "");
      setTipoDocumentoId(data.tipo_documento_id ?? "");
    }

    setMensaje("Perfil guardado correctamente ✅");
    setGuardando(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Mi perfil</h1>
          {userEmail && (
            <p className="text-sm text-muted-foreground">
              Sesión iniciada como{" "}
              <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>

        {cargando ? (
          <p>Cargando perfil...</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Jorge Bohórquez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_documento_id">Tipo de documento</Label>
              <select
                id="tipo_documento_id"
                className="border rounded-md px-3 py-2 text-sm w-full bg-background"
                value={tipoDocumentoId}
                onChange={(e) => setTipoDocumentoId(e.target.value)}
              >
                <option value="">Selecciona una opción...</option>
                {tiposDocumento.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.codigo} - {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">Número de documento</Label>
              <Input
                id="documento"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej: 10.000.000 o 900.123.456-7"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGuardar} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar perfil"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/panel")}
              >
                Volver al panel
              </Button>
            </div>

            {mensaje && (
              <p className="text-sm text-muted-foreground">{mensaje}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
