// app/recuperar/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleEnviar = async () => {
    setMensaje(null);
    setCargando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password",
    });

    if (error) {
      setMensaje(`Error: ${error.message}`);
    } else {
      setMensaje(
        "Si el correo existe en nuestro sistema, hemos enviado un enlace para restablecer tu contraseña."
      );
    }

    setCargando(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Recuperar contraseña
        </h1>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button onClick={handleEnviar} disabled={cargando}>
          {cargando ? "Enviando..." : "Enviar enlace de recuperación"}
        </Button>

        {mensaje && <p className="text-sm mt-2">{mensaje}</p>}

        <p className="text-sm text-muted-foreground">
          ¿Ya la recuerdas?{" "}
          <Link href="/login" className="underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
