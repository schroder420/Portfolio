export default async function handler(req, res) {
  const obData = {
    team: "OB",
    position: 6,             // plads i ligaen
    points: 26,              // antal point
    played: 18,              // antal kampe

    goalsFor: 32,
    goalsAgainst: 37,
    goalDiff: 32 - 37,       // så vi kan vise + / -

    lastMatch: {
      opponent: "FC Fredericia",
      home: false,           // true = OB hjemme, false = OB ude
      result: "3-1",         // kampresultat set fra OBs side
      date: "2025-12-05"
    }
  };

  return res.status(200).json(obData);
}