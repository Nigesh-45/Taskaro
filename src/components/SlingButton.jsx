"use client";

import { useEffect, useRef, useState } from "react";

export default function SlingButton({
  onSend,
  padColor = "#f5f5f5",
  iconColor = "#18181b",
  accentColor = "#f5f5f5",
  wellColor = "#27272a",
  bandColor = "#52525b",
  size = 56,
  strokeWidth = 3,
  armAt = 48,
  maxPull = 160,
  launchSpeed = 2600,
  recoil = 0.2,
  flight = 120,
  particles = 14,
  spread = 60,
  axis = "any",
  tapSends = true,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [burstParticles, setBurstParticles] = useState([]);

  const pullDistance = Math.hypot(offset.x, offset.y);
  const isArmed = pullDistance >= armAt;

  // Compute rotation angle so arrow points toward launch direction
  const launchAngleRad =
    pullDistance > 4 ? Math.atan2(-offset.y, -offset.x) : -Math.PI / 4;
  const launchAngleDeg = (launchAngleRad * 180) / Math.PI;

  const triggerLaunch = (dx, dy) => {
    if (disabled) return;

    const dist = Math.hypot(dx, dy);
    const dirX = dist > 1 ? -dx / dist : 0.707;
    const dirY = dist > 1 ? -dy / dist : -0.707;
    const baseAngle = Math.atan2(dirY, dirX);
    const spreadRad = (spread * Math.PI) / 180;

    // Generate particle burst
    const spawned = Array.from({ length: particles }, (_, i) => {
      const angleOffset = (Math.random() - 0.5) * spreadRad;
      const angle = baseAngle + angleOffset;
      const travel = flight * (0.45 + Math.random() * 0.65);
      return {
        id: `${Date.now()}-${i}`,
        tx: Math.cos(angle) * travel,
        ty: Math.sin(angle) * travel,
        r: 2.5 + Math.random() * 3,
      };
    });
    setBurstParticles(spawned);

    // Quick flight & recoil animation
    const flightDurationMs = Math.max(
      90,
      Math.min(220, Math.round((flight / Math.max(launchSpeed, 400)) * 1800))
    );

    setOffset({
      x: dirX * Math.min(flight * 0.35, 36),
      y: dirY * Math.min(flight * 0.35, 36),
    });

    setTimeout(() => {
      setOffset({
        x: -dirX * (armAt * recoil),
        y: -dirY * (armAt * recoil),
      });
    }, Math.round(flightDurationMs * 0.5));

    setTimeout(() => {
      setOffset({ x: 0, y: 0 });
    }, flightDurationMs);

    setTimeout(() => {
      setBurstParticles([]);
    }, 520);

    onSend?.();
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!draggingRef.current) return;
      let dx = e.clientX - startPointRef.current.x;
      let dy = e.clientY - startPointRef.current.y;

      if (axis === "x") dy = 0;
      if (axis === "y") dx = 0;

      const dist = Math.hypot(dx, dy);
      if (dist > maxPull) {
        const scale = maxPull / dist;
        dx *= scale;
        dy *= scale;
      }

      offsetRef.current = { x: dx, y: dy };
      setOffset({ x: dx, y: dy });
    };

    const handlePointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);

      const { x, y } = offsetRef.current;
      const dist = Math.hypot(x, y);

      if (dist >= armAt) {
        triggerLaunch(x, y);
      } else if (tapSends && dist < 8) {
        triggerLaunch(-10, 10);
      } else {
        setOffset({ x: 0, y: 0 });
      }
      offsetRef.current = { x: 0, y: 0 };
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  });

  const handlePointerDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    startPointRef.current = { x: e.clientX, y: e.clientY };
    offsetRef.current = { x: 0, y: 0 };
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerLaunch(-10, 10);
    }
  };

  const half = size / 2;

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="relative inline-flex shrink-0 select-none items-center justify-center"
      title="Tap or pull & release to launch task"
    >
      {/* Anchor Well */}
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: wellColor,
          borderColor: isArmed ? accentColor : "transparent",
        }}
        className="absolute inset-0 rounded-full border-2 shadow-inner transition-colors"
      />

      {/* Elastic Slingshot Bands + Particle Burst SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        {(isDragging || offset.x !== 0 || offset.y !== 0) && (
          <>
            <line
              x1={half - size * 0.24}
              y1={half - size * 0.24}
              x2={half + offset.x}
              y2={half + offset.y}
              stroke={isArmed ? accentColor : bandColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <line
              x1={half + size * 0.24}
              y1={half + size * 0.24}
              x2={half + offset.x}
              y2={half + offset.y}
              stroke={isArmed ? accentColor : bandColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </>
        )}

        {/* Launch Particles */}
        {burstParticles.map((p) => (
          <circle
            key={p.id}
            cx={half + p.tx * 0.65}
            cy={half + p.ty * 0.65}
            r={p.r}
            fill={accentColor}
            className="animate-ping"
          />
        ))}
      </svg>

      {/* Draggable / Tappable Launch Pad */}
      <button
        type="button"
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        aria-label="Add Task"
        style={{
          width: size - 6,
          height: size - 6,
          backgroundColor: padColor,
          color: iconColor,
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${
            isArmed ? 1.08 : 1
          })`,
          transition: isDragging
            ? "none"
            : "transform 220ms cubic-bezier(0.22, 1.4, 0.36, 1)",
          boxShadow: isArmed
            ? `0 0 0 3px ${accentColor}, 0 12px 24px -6px rgba(0,0,0,0.45)`
            : "0 4px 12px rgba(0,0,0,0.22)",
        }}
        className="relative z-10 flex cursor-grab items-center justify-center rounded-full focus:outline-none active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          width={Math.round(size * 0.42)}
          height={Math.round(size * 0.42)}
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: `rotate(${launchAngleDeg + 45}deg)`,
            transition: isDragging ? "none" : "transform 180ms ease",
          }}
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      </button>
    </div>
  );
}
