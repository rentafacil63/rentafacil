"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { ParticlesBackground } from "@/components/ParticlesBackground";

type SplashProps = {
  duration?: number;
  redirectTo?: string;
};

const PARTICLE_TEXT = "BUILDING INTELLIGENT SYSTEMS";

export default function Splash({
  duration = 3000,
  redirectTo = "/home",
}: SplashProps) {
  const [visible, setVisible] = useState(true);
  const [showText, setShowText] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 400);
    const t2 = setTimeout(() => {
      setVisible(false);
      router.push(redirectTo);
    }, duration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [duration, redirectTo, router]);

  if (!visible) return null;

  const charVariants: Variants = {
    hidden: (custom: number) => {
      const angle = custom * 23.7;
      const radius = 40 + (custom % 5) * 8;
      const x = Math.cos((angle * Math.PI) / 180) * radius;
      const y = Math.sin((angle * Math.PI) / 180) * radius;

      return {
        opacity: 0,
        x,
        y,
        scale: 0.5,
        filter: "blur(8px)",
      };
    },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        delay: 0.03 * custom,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#050910] text-white overflow-hidden relative">
      {/* FONDO DE PARTÍCULAS */}
      <ParticlesBackground />

      {/* LOGO */}
      <div className="flex flex-col items-center relative z-10">
        <Image
          src="/LogoBisNew.png"
          alt="BIS Logo"
          width={220}
          height={220}
          priority
          className="drop-shadow-[0_0_20px_rgba(103,255,113,0.5)] animate-pulseGlow"
        />
      </div>

      {/* TEXTO tipo "partículas" */}
      <div className="mt-6 text-lg sm:text-xl md:text-2xl font-semibold text-[#67ff71] relative z-10">
        {PARTICLE_TEXT.split("").map((char, i) => (
          <motion.span
            key={i}
            custom={i}
            variants={charVariants}
            initial="hidden"
            animate={showText ? "visible" : "hidden"}
            className="inline-block tracking-[0.25em]"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
