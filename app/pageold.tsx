// app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <section className="max-w-4xl w-full space-y-10">
        {/* HERO */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Tu declaración de renta, más fácil que nunca
          </h1>
          <p className="text-lg text-muted-foreground">
            Responde unas pocas preguntas y descubre en minutos si estás obligado
            a declarar renta. Sin tecnicismos, sin complicaciones.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/diagnostico">Empezar mi diagnóstico</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
          </div>
        </div>

        {/* CÓMO FUNCIONA */}
        <section className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>1. Responde</CardTitle>
            </CardHeader>
            <CardContent>
              Cuéntanos tus ingresos, patrimonio y algunos datos clave del año.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. Analizamos</CardTitle>
            </CardHeader>
            <CardContent>
              Comparamos tu información con los topes de la DIAN para el año gravable.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>3. Te explicamos</CardTitle>
            </CardHeader>
            <CardContent>
              Te mostramos si probablemente debes declarar y qué puedes hacer.
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
