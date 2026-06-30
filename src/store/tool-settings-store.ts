import { create } from "zustand";

import {
  DEFAULT_FONT_SIZE,
  DRAW_PRESETS,
} from "@/lib/annotations/defaults";
import type { DrawMode } from "@/types/annotations";
import type { ShapeKind } from "@/types/pdf";

interface ToolSettingsState {
  color: string;
  highlightColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  drawMode: DrawMode;
  shapeKind: ShapeKind;
  shapeFilled: boolean;
  stampVariant: string;

  setColor: (color: string) => void;
  setHighlightColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  setFontSize: (size: number) => void;
  setDrawMode: (mode: DrawMode) => void;
  setShapeKind: (kind: ShapeKind) => void;
  setShapeFilled: (filled: boolean) => void;
  setStampVariant: (variant: string) => void;
}

export const useToolSettingsStore = create<ToolSettingsState>((set) => ({
  color: "#18181B",
  highlightColor: "#FFE234",
  strokeWidth: 2,
  opacity: 1,
  fontSize: DEFAULT_FONT_SIZE,
  drawMode: "pen",
  shapeKind: "rect",
  shapeFilled: false,
  stampVariant: "approved",

  setColor: (color) => set({ color }),
  setHighlightColor: (highlightColor) => set({ highlightColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setOpacity: (opacity) => set({ opacity }),
  setFontSize: (fontSize) => set({ fontSize }),
  setDrawMode: (drawMode) =>
    set({ drawMode, strokeWidth: DRAW_PRESETS[drawMode].strokeWidth }),
  setShapeKind: (shapeKind) => set({ shapeKind }),
  setShapeFilled: (shapeFilled) => set({ shapeFilled }),
  setStampVariant: (stampVariant) => set({ stampVariant }),
}));
