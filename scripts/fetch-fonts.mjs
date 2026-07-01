/**
 * Download the bundled text-font library into `public/fonts/` so DoxPDF can both
 * render (via @font-face) and embed (via pdf-lib) each face fully offline — no
 * runtime CDN calls, keeping the privacy promise. Run on postinstall; the files
 * are git-ignored and regenerated on install. All faces are OFL/Apache licensed.
 *
 * Fonts are fetched from the google/fonts repo. Variable fonts are fine —
 * pdf-lib embeds + subsets them to their default (regular) instance.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "fonts");
const BASE = "https://raw.githubusercontent.com/google/fonts/main";

// id → repo path (URL-encoded). Keep in sync with src/lib/fonts/catalog.ts.
const FONTS = {
  // sans
  inter: "ofl/inter/Inter%5Bopsz,wght%5D.ttf",
  sourcesans: "ofl/sourcesans3/SourceSans3%5Bwght%5D.ttf",
  opensans: "ofl/opensans/OpenSans%5Bwdth,wght%5D.ttf",
  lato: "ofl/lato/Lato-Regular.ttf",
  montserrat: "ofl/montserrat/Montserrat%5Bwght%5D.ttf",
  poppins: "ofl/poppins/Poppins-Regular.ttf",
  worksans: "ofl/worksans/WorkSans%5Bwght%5D.ttf",
  raleway: "ofl/raleway/Raleway%5Bwght%5D.ttf",
  nunito: "ofl/nunito/Nunito%5Bwght%5D.ttf",
  dmsans: "ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf",
  // serif
  lora: "ofl/lora/Lora%5Bwght%5D.ttf",
  merriweather: "ofl/merriweather/Merriweather%5Bopsz,wdth,wght%5D.ttf",
  playfairdisplay: "ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf",
  domine: "ofl/domine/Domine%5Bwght%5D.ttf",
  crimsontext: "ofl/crimsontext/CrimsonText-Regular.ttf",
  ebgaramond: "ofl/ebgaramond/EBGaramond%5Bwght%5D.ttf",
  sourceserif: "ofl/sourceserif4/SourceSerif4%5Bopsz,wght%5D.ttf",
  bitter: "ofl/bitter/Bitter%5Bwght%5D.ttf",
  // mono
  jetbrainsmono: "ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
  spacemono: "ofl/spacemono/SpaceMono-Regular.ttf",
  ibmplexmono: "ofl/ibmplexmono/IBMPlexMono-Regular.ttf",
  // display
  oswald: "ofl/oswald/Oswald%5Bwght%5D.ttf",
  bebasneue: "ofl/bebasneue/BebasNeue-Regular.ttf",
  abrilfatface: "ofl/abrilfatface/AbrilFatface-Regular.ttf",
  // handwriting
  caveat: "ofl/caveat/Caveat%5Bwght%5D.ttf",
  dancingscript: "ofl/dancingscript/DancingScript%5Bwght%5D.ttf",
  pacifico: "ofl/pacifico/Pacifico-Regular.ttf",
};

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const ids = Object.keys(FONTS);
  const failed = [];
  await Promise.all(
    ids.map(async (id) => {
      const dest = join(OUT, `${id}.ttf`);
      if (await exists(dest)) return; // already fetched
      try {
        const res = await fetch(`${BASE}/${FONTS[id]}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.byteLength < 1000) throw new Error("suspiciously small");
        await writeFile(dest, buf);
      } catch (e) {
        failed.push(`${id} (${e.message})`);
      }
    }),
  );
  const got = ids.length - failed.length;
  console.log(`[fonts] ${got}/${ids.length} bundled into public/fonts`);
  if (failed.length) console.warn(`[fonts] skipped: ${failed.join(", ")}`);
}

main().catch((e) => {
  // Non-fatal: the editor falls back to the base-14 faces if fonts are missing.
  console.warn("[fonts] fetch skipped:", e.message);
});
