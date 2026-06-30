/** Lightweight skeleton shown while a page is offscreen or still rendering. */
export function PagePlaceholder({
  height,
  pageNumber,
}: {
  height: number;
  pageNumber?: number;
}) {
  return (
    <div
      className="flex w-full items-center justify-center bg-white"
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="border-muted-foreground/20 border-t-muted-foreground/50 size-6 animate-spin rounded-full border-2" />
        {pageNumber ? (
          <span className="text-muted-foreground/40 text-xs font-medium">
            Page {pageNumber}
          </span>
        ) : null}
      </div>
    </div>
  );
}
