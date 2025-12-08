export default async function handler(req, res) {
  const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REFRESH_TOKEN,
  } = process.env;

  // 0) Tjek env vars
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    console.error("Spotify env mangler", {
      SPOTIFY_CLIENT_ID: !!SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: !!SPOTIFY_CLIENT_SECRET,
      SPOTIFY_REFRESH_TOKEN: !!SPOTIFY_REFRESH_TOKEN,
    });
    return res.status(500).json({
      error: "missing_env",
      message: "En eller flere SPOTIFY_* env vars mangler.",
    });
  }

  try {
    // 1) Få access token via refresh token
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

    const tokenText = await tokenRes.text();
    let tokenData = null;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      console.error("Kunne ikke parse token JSON:", tokenText);
      return res.status(500).json({
        error: "token_parse_error",
        raw: tokenText,
      });
    }

    if (!tokenRes.ok) {
      console.error("Spotify token fejl:", tokenData);
      return res.status(500).json({
        error: "token_error",
        detail: tokenData,
      });
    }

    const accessToken = tokenData.access_token;
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    let track = null;

    // 2) Sidst lyttede
    try {
      const recentRes = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=1",
        { headers: authHeaders }
      );

      const recentText = await recentRes.text();
      let recentData = null;

      if (recentText) {
        try {
          recentData = JSON.parse(recentText);
        } catch (e) {
          console.error("recently-played JSON-fejl:", recentText);
        }
      }

      if (recentRes.ok && recentData?.items?.length) {
        const item = recentData.items[0];
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
        console.error("recently-played fejl:", recentRes.status, recentText);
      }
    } catch (err) {
      console.error("recently-played fetch exception:", err);
    }

    // 3) Fallback: top track
    if (!track) {
      try {
        const topRes = await fetch(
          "https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=medium_term",
          { headers: authHeaders }
        );

        const topText = await topRes.text();
        let topData = null;
        if (topText) {
          try {
            topData = JSON.parse(topText);
          } catch (e) {
            console.error("top-tracks JSON-fejl:", topText);
          }
        }

        if (topRes.ok && topData?.items?.length) {
          const t = topData.items[0];
          track = {
            name: t.name,
            artists: t.artists.map((a) => a.name).join(", "),
            album: t.album.name,
            url: t.external_urls?.spotify || null,
            cover: t.album.images?.[0]?.url || null,
            played_at: null,
            source: "top_track",
          };
        } else {
          console.error("top-tracks fejl:", topRes.status, topText);
        }
      } catch (err) {
        console.error("top-tracks fetch exception:", err);
      }
    }

    // 4) Sidste fallback – dummy track (så frontend ALDRIG ser null)
    if (!track) {
      track = {
        name: "OB Op I Top",
        artists: "Arne Lundemann, OB Fans",
        album: "",
        url: "https://open.spotify.com/album/2vzh9i4h4kXrvbRWHtn85C?si=-fN3WjbPRZ-ImXX54GFhwQ",
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