const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CREATOMATE_API_KEY = process.env.CREATOMATE_API_KEY;

const TEMPLATE_MAP = {
  promo_flash: '095dc255-4a4c-4aab-838d-e991471f25f3',
  product_showcase: 'a31a99ed-920c-46c9-96b9-06d678fce3ba',
  story_reel: '3f6923e2-648d-45a2-87de-5e81787909c4'
};

async function callAPI(url, method, headers, body) {
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    console.error(`API error ${res.status}:`, JSON.stringify(data));
    throw new Error(`API ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function sendWhatsAppText(chatId, text) {
  return callAPI('https://gate.whapi.cloud/messages/text', 'POST', {
    'Authorization': `Bearer ${WHAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }, { to: chatId, body: text });
}

async function sendWhatsAppVideo(chatId, videoUrl, caption) {
  return callAPI('https://gate.whapi.cloud/messages/video', 'POST', {
    'Authorization': `Bearer ${WHAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }, { to: chatId, media: videoUrl, caption });
}

async function generateVideoScript(userMessage, hasImage) {
  const imageNote = hasImage
    ? '\nLe client a envoyé une photo de son produit. Elle sera intégrée dans la vidéo. Privilégie le style "product_showcase" quand une image est fournie.'
    : '';

  const systemPrompt = `Tu es un DIRECTEUR ARTISTIQUE PUBLICITAIRE de classe mondiale, spécialisé dans le marché africain francophone. Tu crées des publicités vidéo qui CAPTENT l'attention en 3 secondes et CONVERTISSENT.

Le client te donne une simple description de son produit/service. TOI, tu fais TOUT le travail créatif :
- Tu inventes un ANGLE PUBLICITAIRE percutant (pas juste décrire le produit)
- Tu écris des textes qui VENDENT (pas qui informent)
- Tu choisis des couleurs qui ATTIRENT L'OEIL selon le secteur
- Tu rédiges une narration qui donne ENVIE D'ACHETER${imageNote}

TECHNIQUES PUBLICITAIRES À UTILISER :
- Urgence : "Dernières pièces", "Offre limitée", "Aujourd'hui seulement"
- Émotion : connecter le produit à un désir profond (beauté, statut, confort, santé)
- Preuve sociale : "Déjà adopté par des milliers", "Le choix des experts"
- Bénéfice client : pas les caractéristiques, mais ce que le client GAGNE
- Question rhétorique : "Et si vous pouviez...?", "Vous méritez..."

PSYCHOLOGIE DES COULEURS PAR SECTEUR :
- Restaurant/Food : rouge #E63946, orange #FF8C00, jaune #FFB703
- Mode/Beauté : noir #1A1A2E, doré #D4AF37, rose #E91E8C
- Tech/Services : bleu #0077B6, violet #7B2FBE, cyan #00B4D8
- Santé/Bio : vert #2D6A4F, turquoise #20B2AA
- Luxe/Premium : noir #0D0D0D, or #C9A227, bordeaux #800020
- Immobilier : bleu nuit #1B2838, blanc #F8F9FA

Réponds UNIQUEMENT en JSON valide :
{
  "style": "promo_flash" ou "product_showcase" ou "story_reel",
  "titre": "Accroche CHOC qui arrête le scroll (max 6 mots)",
  "sous_titre": "Bénéfice client irrésistible (max 10 mots)",
  "prix": "Prix si mentionné, sinon null",
  "reduction": "Réduction si mentionnée, sinon null",
  "cta": "Action URGENTE (max 4 mots, ex: Commandez Maintenant !)",
  "couleur_principale": "Code hex adapté au secteur",
  "couleur_accent": "Code hex contraste fort",
  "narration": "3 phrases VENDEUSES : accroche émotionnelle + bénéfice + appel à l'action. Ton chaleureux et persuasif.",
  "duree_secondes": 15 ou 20
}

Choix du style :
- "promo_flash" : TOUTE mention de prix, promo, solde, réduction, offre
- "product_showcase" : présentation produit, lancement, image envoyée
- "story_reel" : histoire, marque, témoignage, vertical 9:16

EXEMPLES DE QUALITÉ ATTENDUE :
- Client dit "je vends des chaussures" → Titre: "Marchez Avec Style" (pas "Chaussures à Vendre")
- Client dit "restaurant africain" → Titre: "Saveurs Qui Font Voyager" (pas "Restaurant Africain")
- Client dit "salon de coiffure" → Titre: "Révélez Votre Beauté" (pas "Salon de Coiffure Ouvert")

Le titre doit donner ENVIE, pas INFORMER. Chaque mot doit VENDRE.`;

  const data = await callAPI('https://api.openai.com/v1/chat/completions', 'POST', {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }, {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 600,
    response_format: { type: 'json_object' }
  });

  const content = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(content);
  } catch {
    return {
      style: 'promo_flash', titre: 'Offre Exceptionnelle',
      sous_titre: 'Ne ratez pas cette opportunité', prix: null,
      reduction: null, cta: 'Commander maintenant',
      couleur_principale: '#FF6B35', couleur_accent: '#FFFFFF',
      narration: 'Découvrez notre offre exceptionnelle du moment.', duree_secondes: 15
    };
  }
}

async function renderVideo(videoData, imageUrl) {
  const templateId = TEMPLATE_MAP[videoData.style] || TEMPLATE_MAP.promo_flash;

  const modifications = {
    'Title': videoData.titre,
    'Subtitle': videoData.sous_titre,
    'CTA': videoData.cta
  };
  if (videoData.prix) modifications['Price'] = videoData.prix;
  if (videoData.reduction) modifications['Discount'] = videoData.reduction;
  if (videoData.couleur_principale) modifications['Background.fill_color'] = videoData.couleur_principale;
  if (imageUrl) modifications['Image'] = imageUrl;

  const render = await callAPI('https://api.creatomate.com/v1/renders', 'POST', {
    'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
    'Content-Type': 'application/json'
  }, { template_id: templateId, modifications });

  const renderId = Array.isArray(render) ? render[0]?.id : render.id;
  return renderId;
}

async function waitForRender(renderId, maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 15000));

    const data = await callAPI(
      `https://api.creatomate.com/v1/renders/${renderId}`, 'GET',
      { 'Authorization': `Bearer ${CREATOMATE_API_KEY}` }
    );

    console.log(`Render ${renderId} status: ${data.status}`);

    if (data.status === 'succeeded') return data.url;
    if (data.status === 'failed') throw new Error('Render failed');
  }
  throw new Error('Render timeout');
}

async function handleMessage(chatId, userText, imageUrl) {
  try {
    console.log(`Message de ${chatId}: ${userText}${imageUrl ? ' [avec image]' : ''}`);

    const confirmMsg = imageUrl
      ? '🎬 Photo reçue ! Je prépare votre vidéo publicitaire avec votre image... Cela prend environ 2 minutes.'
      : '🎬 Je prépare votre vidéo publicitaire... Cela prend environ 2 minutes.';
    await sendWhatsAppText(chatId, confirmMsg);

    console.log('Generation du script IA...');
    const videoData = await generateVideoScript(userText, !!imageUrl);
    console.log('Script IA:', JSON.stringify(videoData));

    console.log('Lancement du rendu Creatomate...');
    const renderId = await renderVideo(videoData, imageUrl);
    console.log('Render ID:', renderId);

    console.log('Attente du rendu...');
    const videoUrl = await waitForRender(renderId);
    console.log('Video prete:', videoUrl);

    const caption = `🎬 Voici votre vidéo publicitaire !\n\n${videoData.narration}\n\n💡 Demandez des modifications à tout moment.`;
    await sendWhatsAppVideo(chatId, videoUrl, caption);

    console.log('Video envoyee avec succes!');
  } catch (error) {
    console.error('Erreur:', error.message);
    await sendWhatsAppText(chatId,
      '⚠️ Désolé, une erreur est survenue. Veuillez réessayer dans quelques instants.');
  }
}

app.post('/webhook', (req, res) => {
  res.status(200).json({ status: 'ok' });

  const body = req.body;
  const messages = body.messages || [];

  for (const msg of messages) {
    if (msg.from_me) continue;
    const chatId = msg.chat_id || msg.from || '';
    if (chatId.includes('@g.us')) continue;

    let text = '';
    if (typeof msg.text === 'string') text = msg.text;
    else if (msg.text && msg.text.body) text = msg.text.body;
    else if (typeof msg.body === 'string') text = msg.body;

    const imageCaption = (msg.image && typeof msg.image.caption === 'string') ? msg.image.caption : '';
    const imageLink = (msg.image && msg.image.link) ? msg.image.link : '';
    const userText = (text || imageCaption).trim();

    if (userText.length < 5) continue;

    handleMessage(chatId, userText, imageLink || null);
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Agent Video Pub actif', version: '1.0' });
});

app.listen(PORT, () => {
  console.log(`Agent Video Pub demarre sur le port ${PORT}`);
  console.log('Webhook URL: /webhook');
  if (!WHAPI_TOKEN) console.warn('WHAPI_TOKEN non configure!');
  if (!OPENAI_API_KEY) console.warn('OPENAI_API_KEY non configure!');
  if (!CREATOMATE_API_KEY) console.warn('CREATOMATE_API_KEY non configure!');
});
