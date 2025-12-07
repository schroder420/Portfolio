export default async function handler(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const code = req.query.code;

  if (!code) {
    return res
      .status(400)
      .send("ingen 'code' i query. start login via spotify authorize-link først.");
  }

  const redirectUri = "https://mikkelschroder.com/api/spotify-init";

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("spotify token error:", data);
      return res
        .status(500)
        .send("fejl ved token exchange – tjek console/logs i vercel.");
    }

    const refreshToken = data.refresh_token;

    if (!refreshToken) {
      console.log("response fra spotify:", data);
      return res
        .status(500)
        .send("ingen refresh_token i svar – har du måske allerede brugt koden?");
    }

    // vis den pænt, så du kan kopiere den
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`
      <h1>spotify refresh token</h1>
      <p>kopiér denne token og gem den som <code>SPOTIFY_REFRESH_TOKEN</code> i vercel:</p>
      <pre>${refreshToken}</pre>
      <p>når du har gemt den, kan du slette <code>/api/spotify-init.js</code> eller lade den være.</p>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("serverfejl – se logs i vercel.");
  }
}