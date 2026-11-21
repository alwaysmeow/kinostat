export async function getLetterboxdPoster(uri: string, fetcher: typeof fetch = fetch) {
  try {
    const response = await fetcher(uri, {
      redirect: "follow",
      headers: {
        accept: "text/html",
        "user-agent": "Mozilla/5.0 (compatible; Kinostat/2.0)",
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/https:\/\/a\.ltrbxd\.com\/resized\/film-poster\/[^"']+/i);
    return match?.[0]?.replaceAll("&amp;", "&") ?? null;
  } catch {
    return null;
  }
}
