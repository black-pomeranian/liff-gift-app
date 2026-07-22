const cache = new Map<string, Promise<ArrayBuffer>>();

/**
 * Google Fonts から Noto Sans JP (Bold) の必要なグリフだけを取得する。
 * next/og（内部で satori を使用）は日本語グリフを内蔵していないため、
 * OG 画像に日本語を描画するにはフォントデータを明示的に渡す必要がある。
 */
export async function loadJapaneseFont(text: string): Promise<ArrayBuffer> {
  const uniqueChars = Array.from(new Set(text)).join("");
  const cached = cache.get(uniqueChars);
  if (cached) return cached;

  const promise = (async () => {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(uniqueChars)}`;
    const cssRes = await fetch(cssUrl);
    if (!cssRes.ok) {
      throw new Error(`Google Fonts CSS の取得に失敗しました (${cssRes.status})`);
    }
    const css = await cssRes.text();
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
    if (!match) {
      throw new Error("フォント URL が見つかりませんでした");
    }
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) {
      throw new Error(`フォントファイルの取得に失敗しました (${fontRes.status})`);
    }
    return fontRes.arrayBuffer();
  })();

  cache.set(uniqueChars, promise);
  return promise;
}
