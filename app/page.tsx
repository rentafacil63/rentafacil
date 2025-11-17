"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Shield, Zap, Headphones } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function HomePage() {
  const [loggedUser, setLoggedUser] = useState<any | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      setLoggedUser(user);
    };

    loadUser();
  }, []);

  const isLoggedIn = !!loggedUser;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-5xl font-bold text-slate-900">
          Declaración de renta para persona natural
        </h1>
        <p className="mb-8 text-xl text-slate-600">
          Descúbrelo en minutos: consulta gratis directo con la DIAN
        </p>

        <div className="flex justify-center gap-4">
          {/* Botón principal dependiente de la sesión */}
          <Link href={isLoggedIn ? "/home" : "/login"}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              {isLoggedIn ? "Ir a mi panel" : "Comenzar ahora"}
            </Button>
          </Link>

          <Button size="lg" variant="outline" asChild>
            <Link href="/diagnostico">Empezar mi diagnóstico</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-12 md:grid-cols-4">
        {[
          { icon: Zap, title: "Fácil", desc: "No necesitas saber contabilidad" },
          {
            icon: BadgeCheck,
            title: "Ahorras dinero",
            desc: "Paga el mínimo legal",
          },
          { icon: Shield, title: "100% seguro", desc: "Protegemos tu información" },
          { icon: Headphones, title: "Asesorías", desc: "Soporte con expertos" },
        ].map((item, i) => (
          <Card key={i} className="p-6 text-center">
            <CardContent className="pt-6">
              <item.icon className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 font-bold">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="container mx-auto my-12 rounded-lg bg-blue-600 px-4 py-16 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">
          ¿Aún no sabes si te toca declarar?
        </h2>
        <Button size="lg" variant="secondary" className="text-blue-600">
          Hacer consulta gratis
        </Button>
      </div>
    </main>
  );
}
