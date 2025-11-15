// app/registro/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async () => {
    setMensaje(null);
    setCargando(true);

    // 1. Crear el usuario en auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMensaje(`Error: ${error.message}`);
      setCargando(false);
      return;
    }

    // 2. Crear registro en tabla perfil (opcional, pero útil)
    const user = data.user;
    if (user) {
      await supabase.from("perfil").insert({
        id: user.id,
        nombre: nombre || null,
        documento: null,
      });
    }

    setMensaje(
      "Cuenta creada. Revisa tu correo si se requiere confirmación, y luego inicia sesión."
    );
    setCargando(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            placeholder="Tu nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button onClick={handleRegistro} disabled={cargando}>
          {cargando ? "Creando cuenta..." : "Registrarme"}
        </Button>

        {mensaje && <p className="text-sm mt-2">{mensaje}</p>}

        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
