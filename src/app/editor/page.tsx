import type { Metadata } from "next";

import { EditorClient } from "@/features/editor/components/editor-client";

export const metadata: Metadata = {
  title: "Editor",
};

export default function EditorPage() {
  return <EditorClient />;
}
