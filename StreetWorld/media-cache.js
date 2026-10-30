const media = new Map();

export function loadMedia(source) {
  const url = new URL(source, document.baseURI).href;
  if (!media.has(url)) {
    media.set(
      url,
      fetch(url, { cache: "force-cache" }).then(async (response) => {
        if (response.status !== 200) {
          throw new Error(`Media download failed: ${response.status} ${url}`);
        }
        return URL.createObjectURL(await response.blob());
      }),
    );
  }
  return media.get(url);
}
