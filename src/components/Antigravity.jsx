"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function AntigravityParticleField({
  count = 320,
  magnetRadius = 11,
  ringRadius = 7.5,
  waveSpeed = 0.45,
  waveAmplitude = 0.9,
  particleSize = 1.4,
  lerpSpeed = 0.075,
  color = "#818cf8",
  rotationSpeed = 0.25,
  particleVariance = 0.85,
  fieldStrength = 9,
}) {
  const meshRef = useRef(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cursor = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      cursor.current.x = (nx * viewport.width) / 2;
      cursor.current.y = (ny * viewport.height) / 2;
      cursor.current.active = true;
    };

    const onLeave = () => {
      cursor.current.active = false;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [viewport.width, viewport.height]);

  const particles = useMemo(() => {
    const spreadW = Math.max(viewport.width * 1.4, 36);
    const spreadH = Math.max(viewport.height * 1.4, 24);

    return Array.from({ length: count }, (_, idx) => {
      const originX = (Math.random() - 0.5) * spreadW;
      const originY = (Math.random() - 0.5) * spreadH;
      const originZ = (Math.random() - 0.5) * 14;
      return {
        originX,
        originY,
        originZ,
        x: originX,
        y: originY,
        z: originZ,
        angle: (idx / count) * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        scaleOffset: 0.65 + Math.random() * particleVariance,
        orbitJitter: (Math.random() - 0.5) * (10 / Math.max(fieldStrength, 1)),
      };
    });
  }, [count, viewport.width, viewport.height, particleVariance, fieldStrength]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = state.clock.getElapsedTime();
    const mx = cursor.current.active
      ? cursor.current.x
      : Math.cos(elapsed * 0.4) * 3.5;
    const my = cursor.current.active
      ? cursor.current.y
      : Math.sin(elapsed * 0.3) * 2.2;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.originX - mx;
      const dy = p.originY - my;
      const dist = Math.hypot(dx, dy);

      let tx = p.originX + Math.sin(elapsed * waveSpeed + p.phase) * 0.55;
      let ty = p.originY + Math.cos(elapsed * waveSpeed + p.phase) * 0.55;
      let tz = p.originZ;
      let boost = 1;

      if (dist < magnetRadius) {
        const theta = p.angle + elapsed * rotationSpeed;
        const radialWave =
          ringRadius +
          p.orbitJitter +
          Math.sin(elapsed * 2.2 + p.phase) * waveAmplitude * 0.5;

        tx = mx + Math.cos(theta) * radialWave;
        ty = my + Math.sin(theta) * radialWave;
        tz = Math.sin(theta * 2 + elapsed) * 1.8;
        boost = 1.45;
      }

      p.x += (tx - p.x) * lerpSpeed;
      p.y += (ty - p.y) * lerpSpeed;
      p.z += (tz - p.z) * lerpSpeed;

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(elapsed * 0.6 + p.phase, elapsed * 0.4 + p.phase, 0);

      const pulse = 0.85 + Math.sin(elapsed * 2.8 + p.phase) * 0.2;
      const finalScale = particleSize * 0.11 * p.scaleOffset * pulse * boost;
      dummy.scale.set(finalScale, finalScale, finalScale * 1.9);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <capsuleGeometry args={[0.35, 0.7, 6, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} />
    </instancedMesh>
  );
}

export default function Antigravity(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    >
      <Canvas
        camera={{ position: [0, 0, 26], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <AntigravityParticleField {...props} />
      </Canvas>
    </div>
  );
}
