"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabaseBrowser.auth.signOut();
      router.push("/"); // volver a la landing
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      // Si quieres puedes mostrar un toast o alert aquí
      alert("Hubo un error cerrando la sesión. Intenta de nuevo.");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-xs"
    >
      Cerrar sesión
    </Button>
  );
}
