"use client";

import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export function ParticlesBackground() {
  return (
    <Particles
      id="tsparticles"
      init={async (engine) => {
        // carga el bundle completo de tsParticles
        await loadFull(engine);
      }}
      className="absolute inset-0 z-0 pointer-events-none"
      options={{
        fullScreen: { enable: false },
        background: {
          color: { value: "transparent" },
        },
        particles: {
          number: {
            value: 80,
            density: { enable: true, area: 800 },
          },
          color: { value: "#67ff71" },
          size: {
            value: 4,
            random: true,
          },
          move: {
            enable: true,
            speed: 1.2,
            direction: "none",
            outModes: { default: "out" },
          },
          opacity: {
            value: 0.9,
            random: true,
          },
          links: {
            enable: true,
            distance: 140,
            color: "#67ff71",
            opacity: 0.5,
            width: 1,
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
            onClick: { enable: false, mode: "push" },
          },
          modes: {
            repulse: { distance: 80 },
          },
        },
      }}
    />
  );
}
