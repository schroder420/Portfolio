// /api/spotify-init.js på Vercel (Node serverless)
export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send("Mangler 'code' i query");
    }

    // BYT UD til dine egne env-variabler
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res
        .status(500)
        .send("Mangler SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET i Vercel");
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // VIGTIGT: redirect_uri SKAL være 100% identisk med den i Spotify Dashboard
    const redirectUri = "https://mikkelschroder.com/api/spotify-init";

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const raw = await tokenRes.text(); // læs ALTID som tekst først

    if (!tokenRes.ok) {
      console.error(
        "Spotify token error:",
        tokenRes.status,
        tokenRes.statusText,
        raw
      );
      return res
        .status(500)
        .send("Spotify token error – se rå svar i Vercel logs.");
    }

    const data = JSON.parse(raw);

    // Her får du både access_token og refresh_token
    console.log("SPOTIFY TOKENS:", data);

    // VIGTIGT: Gem refresh_token i en env-var i Vercel bagefter:
    // data.refresh_token

    return res.send(
      "Alt godt 👍 Tjek Vercel logs for refresh_token og gem den som env-var."
    );
  } catch (err) {
    console.error("spotify-init fejl:", err);
    return res.status(500).send("serverfejl – se logs i vercel.");
  }
}