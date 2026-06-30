import { nanoid } from "nanoid";
import { create } from "zustand";

export type SignatureKind = "signature" | "initials";

export interface SavedSignature {
  id: string;
  dataUrl: string;
  kind: SignatureKind;
}

interface SignatureState {
  /** Saved (session-only) signatures available for re-use. */
  signatures: SavedSignature[];
  dialogOpen: boolean;
  add: (dataUrl: string, kind: SignatureKind) => SavedSignature;
  remove: (id: string) => void;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useSignatureStore = create<SignatureState>((set) => ({
  signatures: [],
  dialogOpen: false,
  add: (dataUrl, kind) => {
    const sig: SavedSignature = { id: nanoid(6), dataUrl, kind };
    set((s) => ({ signatures: [sig, ...s.signatures].slice(0, 12) }));
    return sig;
  },
  remove: (id) =>
    set((s) => ({ signatures: s.signatures.filter((x) => x.id !== id) })),
  openDialog: () => set({ dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false }),
}));
