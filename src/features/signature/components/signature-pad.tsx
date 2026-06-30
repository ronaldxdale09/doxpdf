"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { trimCanvasToDataUrl } from "../lib/render";

export interface SignaturePadHandle {
  getDataUrl: () => string | null;
  clear: () => void;
}

/** A pointer/touch/pen drawing surface that exports a trimmed transparent PNG. */
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { color?: string }
>(function SignaturePad({ color = "#16182e" }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
  }, [color]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const endStroke = () => {
    drawing.current = false;
    last.current = null;
  };

  useImperativeHandle(
    ref,
    () => ({
      getDataUrl: () =>
        canvasRef.current ? trimCanvasToDataUrl(canvasRef.current) : null,
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
    }),
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerLeave={endStroke}
      className="bg-card h-44 w-full touch-none rounded-lg border"
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent calc(100% - 1px), color-mix(in oklch, var(--muted-foreground) 25%, transparent) 0)",
      }}
    />
  );
});
