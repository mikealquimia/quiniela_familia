// api/resultados.js — Vercel Serverless Function

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey     = req.query.key;
  const leagueIdQ  = req.query.leagueId;   // override manual si está guardado en config
  const season     = req.query.season     || '2026';
  const leagueName = req.query.leagueName || 'FIFA World Cup';

  if (!apiKey) return res.status(400).json({ error: 'Falta el parámetro key' });

  try {
    let leagueId = leagueIdQ ? parseInt(leagueIdQ) : null;
    let leaguesFound = [];

    // Si no se pasa leagueId manual, buscamos por nombre
    if (!leagueId) {
      const leaguesRes = await fetch(
        `https://v3.football.api-sports.io/leagues?name=${encodeURIComponent(leagueName)}&season=${season}`,
        { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
      );
      const leaguesData = await leaguesRes.json();
      leaguesFound = leaguesData.response || [];
      leagueId = leaguesFound.length > 0 ? leaguesFound[0].league.id : 1;
    }

    // Traer TODOS los partidos del torneo
    const fixturesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`,
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
    );
    const fixturesData = await fixturesRes.json();
    const allFixtures = fixturesData.response || [];

    // Filtrar solo los finalizados
    const finished = allFixtures.filter(f =>
      ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
    );

    // Info de diagnóstico
    const statuses = [...new Set(allFixtures.map(f => f.fixture.status.short))];
    const diag = {
      leagueFound:      leaguesFound.map(l => `${l.league.name} (ID: ${l.league.id})`),
      leagueIdUsed:     leagueId,
      leagueIdManual:   leagueIdQ || null,
      season,
      leagueName,
      totalFixtures:    allFixtures.length,
      finishedFixtures: finished.length,
      statusesFound:    statuses,
      accountInfo:      fixturesData.errors || [],
      rateLimit: {
        remaining: fixturesRes.headers.get('x-ratelimit-requests-remaining'),
        limit:     fixturesRes.headers.get('x-ratelimit-requests-limit'),
      }
    };

    return res.status(200).json({ response: finished, diag });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
