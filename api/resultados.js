// api/resultados.js — Vercel Serverless Function

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.query.key;
  if (!apiKey) return res.status(400).json({ error: 'Falta el parámetro key' });

  try {
    // Primero: buscar el ID correcto del Mundial 2026
    const leaguesRes = await fetch(
      'https://v3.football.api-sports.io/leagues?name=FIFA World Cup&season=2026',
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
    );
    const leaguesData = await leaguesRes.json();
    const leagues = leaguesData.response || [];

    // Obtener partidos finalizados con el league ID correcto (o 1 como fallback)
    const leagueId = leagues.length > 0 ? leagues[0].league.id : 1;

    // Traer TODOS los partidos del torneo (no solo FT) para diagnóstico
    const fixturesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2026`,
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
    );
    const fixturesData = await fixturesRes.json();
    const allFixtures = fixturesData.response || [];

    // Filtrar solo los finalizados
    const finished = allFixtures.filter(f => 
      ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
    );

    // Info de diagnóstico para el modal
    const statuses = [...new Set(allFixtures.map(f => f.fixture.status.short))];
    const diag = {
      leagueFound: leagues.map(l => `${l.league.name} (ID: ${l.league.id})`),
      leagueIdUsed: leagueId,
      totalFixtures: allFixtures.length,
      finishedFixtures: finished.length,
      statusesFound: statuses,
      accountInfo: fixturesData.errors || [],
      rateLimit: {
        remaining: fixturesRes.headers.get('x-ratelimit-requests-remaining'),
        limit: fixturesRes.headers.get('x-ratelimit-requests-limit'),
      }
    };

    return res.status(200).json({ response: finished, diag });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
