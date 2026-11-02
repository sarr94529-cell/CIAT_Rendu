// Fonction serveur Netlify : /.netlify/functions/synthese
// La clé d'API reste ici, côté serveur. Elle ne doit jamais apparaître dans index.html.
// Variable d'environnement à créer dans Netlify : ANTHROPIC_API_KEY
// Facultatif : ANTHROPIC_MODEL (par défaut ci-dessous)

const MODELE = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

const CLES_NOMBRES = [
  "idees", "selectionnes", "tauxSelection", "prototypes", "avancementMoyen",
  "enRetard", "retardMoyenJours", "partenariats", "financementFCFA", "partFemmes",
  "dossiersDomainePrincipal"
];

const reponse = (code, corps) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(corps)
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return reponse(405, { erreur: "Méthode non autorisée" });
  if (!process.env.ANTHROPIC_API_KEY) return reponse(500, { erreur: "Clé API absente côté serveur" });

  let entree;
  try { entree = JSON.parse(event.body || "{}"); }
  catch { return reponse(400, { erreur: "JSON invalide" }); }

  // Liste blanche : seuls des nombres et quelques libellés courts passent.
  // Rien d'autre n'atteint le modèle, ce qui limite l'injection de consignes.
  const stats = {};
  for (const k of CLES_NOMBRES) {
    const v = Number(entree?.stats?.[k]);
    if (!Number.isFinite(v)) return reponse(400, { erreur: "Statistique invalide : " + k });
    stats[k] = v;
  }
  const court = (s) => String(s ?? "").slice(0, 60).replace(/[^\p{L}\p{N} ,\-'’()/]/gu, "");
  stats.domainePrincipal = court(entree?.stats?.domainePrincipal);
  const f = entree?.filtres || {};
  const filtres = {
    du: court(f.du), au: court(f.au), cohorte: court(f.cohorte),
    domaine: court(f.domaine), statut: court(f.statut), genre: court(f.genre)
  };

  const consigne =
    "Tu rédiges une fiche de synthèse en français pour le coordonnateur du CIAT (ISEP Amadou Trawaré). " +
    "Utilise uniquement les chiffres fournis. N'invente aucun chiffre, aucune cause, aucune tendance. " +
    "Ne calcule rien de nouveau : cite les valeurs telles quelles. Si une information manque, écris-le. " +
    "Maximum 5 phrases, ton direct, sans formules creuses. " +
    "Termine par une phrase indiquant que ces données sont à valider par un humain.";

  const contenu =
    "Filtres actifs : " + JSON.stringify(filtres) + "\n" +
    "Indicateurs : " + JSON.stringify(stats);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 400,
        system: consigne,
        messages: [{ role: "user", content: contenu }]
      })
    });
    if (!r.ok) return reponse(502, { erreur: "Erreur du service d'IA (" + r.status + ")" });
    const j = await r.json();
    const texte = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    if (!texte) return reponse(502, { erreur: "Réponse vide" });
    return reponse(200, { texte, modele: MODELE });
  } catch (e) {
    return reponse(502, { erreur: "Service d'IA injoignable" });
  }
};
