// /api/ob-stilling.js

export default async function handler(req, res) {
  // Her opdaterer du bare tallene manuelt, når stillingen ændrer sig
  const obData = {
    team: "OB",
    position: 8,        // plads i ligaen
    points: 21,         // antal point
    played: 16,         // antal kampe

    goalsFor: 20,
    goalsAgainst: 23,
    goalDiff: 20 - 23,  // så vi kan vise + / -

    form: "V-U-T-V-U",  // helt valgfrit, bare pynt

    lastMatch: {
      opponent: "Randers FC",
      home: true,       // true = OB hjemme, false = OB ude
      result: "2-1",    // kampresultat set fra OBs side
      date: "2024-12-08"
    }
  };

  return res.status(200).json(obData);
}