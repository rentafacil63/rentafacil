// app/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BadgeCheck, Shield, Zap, Headphones } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Declaración de renta para persona natural
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          Descúbrelo en minutos: consulta gratis directo con la DIAN
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Comenzar ahora
            </Button>
          </Link>

          <Link href="/diagnostico">
            <Button size="lg" variant="outline">
              Empezar mi diagnóstico
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Zap, title: "Fácil", desc: "No necesitas saber contabilidad" },
          { icon: BadgeCheck, title: "Ahorras dinero", desc: "Paga el mínimo legal" },
          { icon: Shield, title: "100% seguro", desc: "Protegemos tu información" },
          { icon: Headphones, title: "Asesorías", desc: "Soporte con expertos" },
        ].map((item, i) => (
          <Card key={i} className="text-center p-6">
            <CardContent className="pt-6">
              <item.icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 py-16 text-center bg-blue-600 text-white rounded-lg my-12">
        <h2 className="text-3xl font-bold mb-4">
          ¿Aún no sabes si te toca declarar?
        </h2>
        <Link href="/diagnostico">
          <Button size="lg" variant="secondary" className="text-blue-600">
            Hacer consulta gratis
          </Button>
        </Link>
      </div>
    </main>
  )
}
