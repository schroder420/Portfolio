export default async function handler(req, res) {
  const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REFRESH_TOKEN,
  } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return res.status(500).json({
      error: "missing_env",
      message: "Spotify env vars mangler",
    });
  }

  try {
    // 1) Få et friskt access token via refresh token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Spotify token error:", tokenData);
      return res.status(500).json({
        error: "token_error",
        detail: tokenData,
      });
    }

    const accessToken = tokenData.access_token;
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    let track = null;

    // 2) Første forsøg: sidst lyttede sang
    try {
      const recentRes = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=1",
        { headers: authHeaders }
      );

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        const item = recentData?.items?.[0];

        if (item?.track) {
          const t = item.track;
          track = {
            name: t.name,
            artists: t.artists.map((a) => a.name).join(", "),
            album: t.album.name,
            url: t.external_urls?.spotify || null,
            cover: t.album.images?.[0]?.url || null,
            played_at: item.played_at,
            source: "recently_played",
          };
        }
      } else if (recentRes.status !== 204) {
        console.error(
          "recently-played error",
          recentRes.status,
          await recentRes.text()
        );
      }
    } catch (err) {
      console.error("recently-played fetch failed:", err);
    }

    // 3) Fallback: top-sang, hvis der ikke kom noget fra recently played
    if (!track) {
      try {
        const topRes = await fetch(
          "https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=medium_term",
          { headers: authHeaders }
        );

        if (topRes.ok) {
          const topData = await topRes.json();
          const t = topData?.items?.[0];

          if (t) {
            track = {
              name: t.name,
              artists: t.artists.map((a) => a.name).join(", "),
              album: t.album.name,
              url: t.external_urls?.spotify || null,
              cover: t.album.images?.[0]?.url || null,
              played_at: null,
              source: "top_track",
            };
          }
        } else {
          console.error("top-tracks error", topRes.status, await topRes.text());
        }
      } catch (err) {
        console.error("top-tracks fetch failed:", err);
      }
    }

    // 4) Sidste fallback: hårdkodet "dummy"-track,
    // så frontenden ALDRIG ser track === null
    if (!track) {
      track = {
        name: "Kunne ikke hente sidste sang",
        artists: "Spotify API",
        album: "",
        url: "https://open.spotify.com/user", // kan evt. være din profil
        cover: null,
        played_at: null,
        source: "fallback",
      };
    }

    return res.status(200).json({ track });
  } catch (err) {
    console.error("spotify-last-track fatal:", err);
    return res.status(500).json({
      error: "internal_error",
      message: "Serverfejl i spotify-last-track",
    });
  }
}