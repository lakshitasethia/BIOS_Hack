// Fetches and decodes frames off the main thread, handing back ImageBitmaps (transferred, not copied).

type LoadRequest = { type: "load"; frames: { index: number; url: string }[] };

self.addEventListener("message", async (event: MessageEvent<LoadRequest>) => {
  if (event.data.type !== "load") return;
  await Promise.all(
    event.data.frames.map(async ({ index, url }) => {
      try {
        const blob = await (await fetch(url)).blob();
        const bitmap = await createImageBitmap(blob);
        (self as unknown as Worker).postMessage({ type: "frame", index, bitmap }, [bitmap]);
      } catch {
        (self as unknown as Worker).postMessage({ type: "error", index });
      }
    }),
  );
});
