export default async function handler(req, res) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      console.error("Mangler en af SPOTIFY_* env variablerne");
      return res.status(500).json({ error: "spotify_env_missing" });
    }

    // 1) Få et fresh access token via refresh_token
    const basic = Buffer
      .from(`${clientId}:${clientSecret}`)
      .toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Fejl fra Spotify token endpoint:", tokenData);
      return res.status(500).json({ error: "spotify_token_error" });
    }

    const accessToken = tokenData.access_token;

    // 2) Hent senest afspillede track
    const trackRes = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const trackData = await trackRes.json();

    if (!trackRes.ok) {
      console.error("Fejl fra Spotify recently-played:", trackData);
      return res.status(500).json({ error: "spotify_recently_error" });
    }

    const item = trackData.items?.[0];
    if (!item || !item.track) {
      return res.status(200).json({ track: null });
    }

    const t = item.track;

    const payload = {
      track: {
        name: t.name,
        artists: t.artists.map((a) => a.name).join(", "),
        album: t.album.name,
        url: t.external_urls?.spotify || null,
        cover: t.album.images?.[0]?.url || null,
      },
    };

    return res.status(200).json(payload);
  } catch (err) {
    console.error("Uventet fejl i /api/spotify-last-track:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}