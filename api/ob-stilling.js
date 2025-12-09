export default async function handler(req, res) {
  const obData = {
    team: "OB",
    position: 6,
    points: 26,
    played: 18,

    goalsFor: 32,
    goalsAgainst: 37,
    goalDiff: 32 - 37,

    lastMatch: {
      opponent: "FC Fredericia",
      home: false,
      result: "1-3",
      date: "2025-12-05"
    }
  };

  return res.status(200).json(obData);
}