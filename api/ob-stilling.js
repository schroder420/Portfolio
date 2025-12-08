export default async function handler(req, res) {
  try {
    const API_KEY = process.env.API_SPORTS_KEY;

    if (!API_KEY) {
      return res
        .status(500)
        .json({ error: "API key mangler (API_SPORTS_KEY)" });
    }

    const url =
      "https://v3.football.api-sports.io/standings?league=271&season=2024";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-apisports-key": API_KEY,
        // den her bruges normalt kun via RapidAPI, men skader ikke:
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });

    const data = await response.json();

    // Hvis API-Sports selv fejler (forkert nøgle, rate limit osv.)
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Upstream-fejl fra API-Sports",
        status: response.status,
        data,
      });
    }

    if (!data.response || !data.response.length) {
      return res.status(502).json({
        error: "API-Sports returnerede ingen standings",
        raw: data,
      });
    }

    const standings = data.response[0].league.standings[0];

    // OB = id 405
    const OB = standings.find((t) => t.team.id === 405);

    if (!OB) {
      return res.status(404).json({ error: "OB ikke fundet i ligaen", standings });
    }

    const goalsFor = OB.all.goals.for;
    const goalsAgainst = OB.all.goals.against;
    const goalDiff = goalsFor - goalsAgainst;

    return res.status(200).json({
      team: OB.team.name,
      position: OB.rank,
      points: OB.points,
      played: OB.all.played,
      won: OB.all.win,
      draw: OB.all.draw,
      lose: OB.all.lose,
      goalsFor,
      goalsAgainst,
      goalDiff,
      form: OB.form || null,
    });
  } catch (err) {
    console.error("Fejl i OB standings:", err);
    return res
      .status(500)
      .json({ error: "Serverfejl i ob-stilling handler", details: err.message });
  }
}