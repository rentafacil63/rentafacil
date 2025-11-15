// app/reset-password/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  // Opcional: comprobar que hay una sesión válida creada por el enlace
  useEffect(() => {
    const revisar = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setListo(true);
      } else {
        setMensaje(
          "El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo."
        );
      }
    };
    revisar();
  }, []);

  const handleCambiar = async () => {
    setMensaje(null);

    if (password.length < 6) {
      setMensaje("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMensaje(`Error al actualizar: ${error.message}`);
    } else {
      setMensaje("Contraseña actualizada correctamente. Redirigiendo...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }

    setCargando(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Restablecer contraseña
        </h1>

        {!listo && (
          <p className="text-sm text-muted-foreground">
            Verificando enlace...
          </p>
        )}

        {listo && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password2">Confirmar contraseña</Label>
              <Input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>

            <Button onClick={handleCambiar} disabled={cargando}>
              {cargando ? "Guardando..." : "Guardar nueva contraseña"}
            </Button>
          </>
        )}

        {mensaje && <p className="text-sm mt-2">{mensaje}</p>}
      </div>
    </main>
  );
}
