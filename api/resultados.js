// api/resultados.js — Vercel Serverless Function
// Actúa de proxy entre el browser y API-Football, evitando el problema de CORS.
// Se despliega automáticamente en https://tu-app.vercel.app/api/resultados

export default async function handler(req, res) {
  // Permite llamadas desde cualquier origen (tu propia app)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.query.key;
  if (!apiKey) {
    return res.status(400).json({ error: 'Falta el parámetro key' });
  }

  try {
    const response = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026&status=FT',
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error de API-Football: ' + response.status });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
