"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ParticlesBackground } from "@/components/ParticlesBackground";

type SplashProps = {
  duration?: number; // milisegundos
};

const PARTICLE_TEXT = "BUILDING INTELLIGENT SYSTEMS";

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    transition: { duration: 0.4, ease: "easeIn" },
  },
};

export default function Splash({ duration = 3000 }: SplashProps) {
  const [visible, setVisible] = useState(true);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Mostrar texto/logo un poco después
    const textTimer = setTimeout(() => setShowText(true), duration * 0.3);

    // Ocultar splash al final
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Partículas de fondo */}
      <ParticlesBackground />

      {/* Contenido central */}
      <motion.div
        className="relative flex flex-col items-center justify-center px-4 py-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {showText && (
          <>
            <div className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase mb-2">
              {PARTICLE_TEXT}
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              RENTAFACIL
            </h1>
            <p className="text-xs text-muted-foreground">
              Calculando tu experiencia inteligente...
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
