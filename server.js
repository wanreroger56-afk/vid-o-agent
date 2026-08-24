const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GREEN_API_INSTANCE = process.env.GREEN_API_INSTANCE;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

const ALLOWED_NUMBERS = (process.env.ALLOWED_NUMBERS || '').split(',').map(n => n.trim()).filter(Boolean);
const GREEN_API_URL = `https://7107.api.greenapi.com/waInstance${GREEN_API_INSTANCE}`;

// ========== WHATSAPP ==========

async function sendText(chatId, text) {
  await fetch(`${GREEN_API_URL}/sendMessage/${GREEN_API_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message: text })
  });
}

async function sendVideo(chatId, videoUrl, caption) {
  await fetch(`${GREEN_API_URL}/sendFileByUrl/${GREEN_API_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, urlFile: videoUrl, fileName: 'publicite.mp4', caption })
  });
}

// ═══════════════════════════════════════════════════════════
// AGENT 1 : DIRECTEUR IA (OpenAI GPT)
// Analyse le produit, le marché, la cible, la stratégie
// ═══════════════════════════════════════════════════════════

async function directeurIA(message, hasImage) {
  console.log('[1/4] DIRECTEUR IA — Analyse stratégique...');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un DIRECTEUR MARKETING senior, expert du marché BURKINA FASO et AFRIQUE DE L'OUEST.

Tu analyses le message du client et identifies :
- Le produit/service exact
- Le marché cible (jeunes, femmes, professionnels, etc.)
- Les bénéfices clés à mettre en avant
- Le ton à utiliser (luxe, populaire, urgent, inspirant)
- La stratégie publicitaire adaptée au Burkina

Réponds UNIQUEMENT en JSON :
{
  "produit": "description précise du produit/service",
  "marche_cible": "qui sont les clients idéaux au Burkina",
  "benefices_cles": ["bénéfice 1", "bénéfice 2", "bénéfice 3"],
  "ton": "luxe | populaire | urgent | inspirant",
  "strategie": "approche pub recommandée en 1 phrase",
  "mots_cles_locaux": ["mots/expressions qui parlent aux Burkinabè"]
}`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI Directeur ${res.status}`);
  const analyse = JSON.parse(data.choices[0].message.content);
  console.log('  Produit:', analyse.produit);
  console.log('  Cible:', analyse.marche_cible);
  console.log('  Ton:', analyse.ton);
  return analyse;
}

// ═══════════════════════════════════════════════════════════
// AGENT 2 : SCÉNARISTE IA (OpenAI GPT)
// Script 5 scènes — narration française pour avatar HeyGen
// ═══════════════════════════════════════════════════════════

async function scenaristeIA(analyse, hasImage) {
  console.log('[2/4] SCÉNARISTE IA — Script HeyGen 5 scènes...');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un GÉNIE DE LA PUBLICITÉ. Pas un simple rédacteur — un CERVEAU CRÉATIF de niveau mondial.
Tu penses comme David Ogilvy, tu provoques comme TBWA, tu émeus comme les meilleures pubs Apple.

TON UNIQUE OBJECTIF : créer des vidéos qui BLOQUENT LE SCROLL sur TikTok, Instagram, Facebook.

Tu as ZÉRO contrainte technique. Aucune limite de durée par scène.
Tu es LIBRE de créer le spot parfait. Le seul juge, c'est le résultat : est-ce que ça VEND ?

Voici l'analyse stratégique du Directeur Marketing :
${JSON.stringify(analyse, null, 2)}

=== TON ARSENAL DE SCROLL-STOPPERS ===

TECHNIQUES DE HOOK (les 3 premières secondes décident de TOUT) :
- Pattern Interrupt : dire quelque chose de tellement inattendu que le cerveau DOIT écouter
- Curiosity Gap : ouvrir une boucle que le spectateur DOIT fermer ("Tu sais pourquoi les femmes de Ouaga...")
- Bold Claim : affirmation tellement audacieuse qu'on ne peut pas ignorer
- Confession : "Je vais te dire un secret que personne ne te dit..."
- Interpellation directe : "Toi là, oui toi qui scroll..." / "Arrête tout!"
- Social Proof choc : "Tout Ouaga en parle et toi tu ne sais même pas..."

TECHNIQUES DE PERSUASION (psychologie de vente) :
- FOMO : peur de rater quelque chose ("Tes voisines ont déjà commandé")
- Preuve sociale : "Les femmes les plus élégantes du Burkina le savent"
- Réciprocité : donner un conseil gratuit avant de vendre
- Contraste : montrer l'avant/après, le problème/solution
- Storytelling : raconter une micro-histoire en 1 scène
- Sensoriel : faire SENTIR, TOUCHER, VOIR le produit par les mots

EXPRESSIONS BURKINA FASO QUI TUENT :
"Wakat la!", "C'est toi-même qui va voir!", "Ça va te plaire dèh!", "Les gens vont te demander c'est quoi!", "Tu vas briller!", "Faut pas dormir dessus!", "C'est du vrai de vrai!", "Made in qualité!", "Tes copines vont être jalouses!"

${hasImage ? 'Le client a fourni une photo du produit. NE génère PAS de image_prompt.' : ''}

=== MÉTHODE AIDA — LA LOI SACRÉE DE LA PUB ===
Chaque spot DOIT suivre AIDA. C'est non-négociable. C'est la science de la vente.
Aucune limite de durée par scène. Vise 25-40 mots par scène. Total : 50-90 secondes.

🅰️ ATTENTION (Scène 1) — STOPPER LE SCROLL
Les 3 premières secondes décident de TOUT. Si tu perds le spectateur ici, c'est fini.
Hook IMPOSSIBLE à ignorer. Pattern interrupt + curiosité + choc.
L'avatar regarde le spectateur droit dans les yeux et le FIGE sur place.
Techniques : question provocante, affirmation choc, secret révélé, interpellation directe.

ℹ️ INTÉRÊT (Scènes 2-3) — CAPTIVER ET FASCINER
Maintenant que le spectateur est accroché, il faut le GARDER.

Scène 2 — INTÉRÊT : LA DÉCOUVERTE
Présente le produit comme une RÉVÉLATION. Fais monter la curiosité.
L'avatar est passionné, ses mots font VOIR et SENTIR le produit.
Détails sensoriels : textures, parfums, couleurs, sensations tactiles.
Le spectateur doit se dire "attends, c'est quoi ce truc ?"

Scène 3 — INTÉRÊT : LE PROBLÈME/SOLUTION
Montre le problème que le spectateur VIT (frustration, manque, besoin).
Puis révèle comment ce produit RÉSOUT ce problème parfaitement.
Contraste saisissant : la vie SANS vs la vie AVEC.
Le spectateur se reconnaît et pense "c'est exactement ce qu'il me faut".

🔥 DÉSIR (Scène 4) — RENDRE LE PRODUIT IRRÉSISTIBLE
Le spectateur est intéressé, maintenant il doit le VOULOIR à tout prix.
Joue sur : le statut social, la fierté, l'appartenance, la jalousie positive.
"Les gens vont te demander...", "Tu vas être celle/celui que tout le monde regarde..."
Preuve sociale + lifestyle aspirationnel + émotions profondes.
L'avatar crée une vision où le spectateur SE VOIT déjà avec ce produit.

💥 ACTION (Scène 5) — POUSSER À AGIR MAINTENANT
Le désir est là, mais sans action il n'y a PAS de vente.
FOMO maximum : urgence réelle, stock limité, offre qui expire, exclusivité.
Pas juste "commande maintenant" — donne une RAISON CONCRÈTE d'agir MAINTENANT.
L'avatar donne le moyen précis de commander (WhatsApp, lien, téléphone).
Dernière phrase = la plus mémorable de tout le spot.

=== RÈGLES D'OR ===
- Chaque narration : 25-40 mots EN FRANÇAIS, ton ORAL naturel
- Tu parles comme un ami charismatique, pas comme un robot
- Utilise le TU — on s'adresse à UNE personne
- Chaque mot doit MÉRITER sa place — pas de remplissage
- Expressions locales burkinabè = authenticité = confiance
- Le texte doit donner envie de RÉÉCOUTER la pub
- Tu es le cerveau — RÉFLÉCHIS, ne fais pas du générique

Réponds UNIQUEMENT en JSON :
{
  "hook": "PHRASE CHOC max 8 mots MAJUSCULES — le scroll-stopper",
  "titre": "Nom produit max 5 mots",
  "benefice": "Bénéfice irrésistible max 10 mots",
  "cta": "Action urgente max 6 mots",
  "angle": "L'angle marketing choisi en 1 phrase (ex: FOMO, exclusivité, transformation...)",
  "image_prompt": "EN ANGLAIS: prompt DALL-E pour photo produit publicitaire premium, vertical 9:16, no text no logo, luxury commercial photography",
  "scenes": [
    { "nom": "ATTENTION", "narration": "25-40 mots. Hook scroll-stopper impossible à ignorer." },
    { "nom": "INTÉRÊT-Découverte", "narration": "25-40 mots. Révélation sensorielle du produit." },
    { "nom": "INTÉRÊT-Solution", "narration": "25-40 mots. Problème/solution, avant/après." },
    { "nom": "DÉSIR", "narration": "25-40 mots. Statut, fierté, preuve sociale, le rêve." },
    { "nom": "ACTION", "narration": "25-40 mots. FOMO + moyen concret de commander." }
  ]
}`
        },
        { role: 'user', content: `Crée un spot pub MÉTHODE AIDA en 5 SCÈNES pour : ${analyse.produit}\n\nStructure AIDA obligatoire :\n1. ATTENTION — hook scroll-stopper\n2. INTÉRÊT — découverte sensorielle du produit\n3. INTÉRÊT — problème/solution\n4. DÉSIR — preuve sociale + lifestyle\n5. ACTION — FOMO + comment commander\n\nTu es LIBRE — aucune contrainte de durée. 25-40 mots par scène.\nRÉFLÉCHIS d'abord : quel ANGLE et quelle ÉMOTION vont TUER pour ce produit au Burkina ? Puis écris chaque scène comme si ta carrière en dépendait.` }
      ],
      temperature: 0.9,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI Scénariste ${res.status}`);
  const script = JSON.parse(data.choices[0].message.content);
  console.log('  Hook:', script.hook);
  console.log('  Angle:', script.angle || 'N/A');
  console.log(`  Scènes: ${script.scenes?.length || 0}`);
  script.scenes?.forEach((s, i) => console.log(`    ${i + 1}. ${s.nom}: ${s.narration?.substring(0, 80)}...`));
  return script;
}

// ═══════════════════════════════════════════════════════════
// AGENT 3 : CRÉATEUR D'IMAGES (DALL-E / gpt-image-1)
// Image produit pour arrière-plan HeyGen
// ═══════════════════════════════════════════════════════════

async function createurImages(prompt) {
  console.log('[3/4] CRÉATEUR D\'IMAGES — DALL-E HD...');

  const cleanPrompt = prompt
    .replace(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/g, (match) => {
      const brands = ['Khamrah','Lattafa','Dukhan','Nike','Adidas','Apple','Samsung','Gucci','Chanel','Dior','Louis Vuitton','Versace','Prada','Rolex','Cartier'];
      return brands.some(b => match.toLowerCase().includes(b.toLowerCase())) ? 'luxury product' : match;
    });

  const enhancedPrompt = cleanPrompt +
    '. Shot with professional cinema camera, shallow depth of field, product perfectly centered in frame, ' +
    'luxury commercial photography lighting with warm key light and cool fill, ' +
    'the image must look like a frame from a high-end TV commercial, ' +
    'absolutely no text, no words, no letters, no watermarks, no brand names, no logos anywhere in the image.';

  async function tryGenerate(p) {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: p,
        size: '1024x1536',
        quality: 'high'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('  Image error:', JSON.stringify(data).substring(0, 300));
      return null;
    }
    const item = data.data?.[0];
    if (item?.url) return item.url;
    if (item?.b64_json) {
      const id = Date.now().toString(36);
      imageStore[id] = item.b64_json;
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN || 'vid-o-agent-production.up.railway.app';
      const imgUrl = `https://${domain}/img/${id}`;
      console.log('  Image servie:', imgUrl);
      setTimeout(() => { delete imageStore[id]; }, 600000);
      return imgUrl;
    }
    console.error('  Pas d\'image dans la réponse:', JSON.stringify(data).substring(0, 200));
    return null;
  }

  let url = await tryGenerate(enhancedPrompt);
  if (!url) {
    console.log('  DALL-E retry avec prompt générique...');
    const fallback = 'Elegant luxury product displayed on dark marble surface, professional studio photography, warm golden lighting, shallow depth of field, premium commercial aesthetic, no text no words no letters no logos no watermarks, vertical composition 9:16, hyper realistic, 8K';
    url = await tryGenerate(fallback);
  }

  console.log('  Image:', url ? 'OK' : 'ECHEC');
  if (!url) throw new Error('DALL-E: impossible de générer l\'image');
  return url;
}

// ═══════════════════════════════════════════════════════════
// AGENT 4 : HEYGEN IA
// Avatar ultra-réaliste + Voix + Scènes + Montage = TOUT EN 1
// Remplace : Sora + OpenAI TTS + FFmpeg
// ═══════════════════════════════════════════════════════════

let heygenConfig = null;

async function initHeyGen() {
  if (heygenConfig) return heygenConfig;

  console.log('[HEYGEN] Chargement avatars et voix...');

  if (process.env.HEYGEN_AVATAR_ID && process.env.HEYGEN_VOICE_ID) {
    heygenConfig = {
      avatar_id: process.env.HEYGEN_AVATAR_ID,
      voice_id: process.env.HEYGEN_VOICE_ID
    };
    console.log(`  Avatar (env): ${heygenConfig.avatar_id}`);
    console.log(`  Voix (env): ${heygenConfig.voice_id}`);
    return heygenConfig;
  }

  const avRes = await fetch('https://api.heygen.com/v2/avatars', {
    headers: { 'X-Api-Key': HEYGEN_API_KEY }
  });
  const avData = await avRes.json();
  const avatars = avData.data?.avatars || [];

  const voRes = await fetch('https://api.heygen.com/v2/voices', {
    headers: { 'X-Api-Key': HEYGEN_API_KEY }
  });
  const voData = await voRes.json();
  const voices = voData.data?.voices || [];

  const avatar = avatars[0];
  if (!avatar) throw new Error('HeyGen: aucun avatar disponible');

  const frVoice = voices.find(v => {
    const lang = (v.language || '').toLowerCase();
    return lang.includes('french') || lang.includes('français') || lang.includes('fr-fr') || lang.includes('fr_fr');
  });

  heygenConfig = {
    avatar_id: avatar.avatar_id,
    voice_id: frVoice?.voice_id || voices[0]?.voice_id
  };

  console.log(`  Avatars dispo: ${avatars.length}`);
  console.log(`  Voix dispo: ${voices.length}`);
  console.log(`  Avatar: ${heygenConfig.avatar_id} (${avatar.avatar_name || ''})`);
  console.log(`  Voix: ${heygenConfig.voice_id} (${frVoice?.name || 'default'})`);

  return heygenConfig;
}

async function heygenIA(scenes, backgroundUrl) {
  console.log(`[4/4] HEYGEN IA — ${scenes.length} scènes + avatar + voix...`);

  const config = await initHeyGen();

  const videoInputs = scenes.map(scene => {
    const input = {
      character: {
        type: 'avatar',
        avatar_id: config.avatar_id,
        avatar_style: 'normal'
      },
      voice: {
        type: 'text',
        input_text: scene.narration,
        voice_id: config.voice_id
      }
    };

    if (backgroundUrl) {
      input.background = { type: 'image', url: backgroundUrl };
    } else {
      input.background = { type: 'color', value: '#0a0a0a' };
    }

    return input;
  });

  console.log('  Envoi à HeyGen...');
  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': HEYGEN_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_inputs: videoInputs,
      dimension: { width: 1080, height: 1920 }
    })
  });

  const data = await res.json();
  if (data.error) {
    console.error('  HeyGen error:', JSON.stringify(data).substring(0, 300));
    throw new Error(`HeyGen: ${data.error.message || data.error.code || 'erreur'}`);
  }

  const videoId = data.data?.video_id;
  if (!videoId) throw new Error('HeyGen: pas de video_id');

  console.log(`  Video ID: ${videoId}`);
  console.log('  Génération (~2-5 min)...');

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 10000));

    const pollRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': HEYGEN_API_KEY }
    });
    const pollData = await pollRes.json();
    const status = pollData.data?.status;

    if (status === 'completed') {
      const videoUrl = pollData.data?.video_url;
      console.log('  VIDÉO HEYGEN PRÊTE!');
      console.log(`  URL: ${videoUrl}`);
      console.log(`  Durée: ${pollData.data?.duration?.toFixed(1)}s`);
      return videoUrl;
    }

    if (status === 'failed') {
      console.error('  HeyGen FAILED:', JSON.stringify(pollData.data).substring(0, 200));
      throw new Error(`HeyGen: ${pollData.data?.error || 'génération échouée'}`);
    }

    if (i % 6 === 0 && i > 0) {
      console.log(`  ... ${Math.round(i * 10 / 60)} min (${status})`);
    }
  }

  throw new Error('HeyGen: timeout 10min');
}

// ═══════════════════════════════════════════════════════════
// PIPELINE COMPLET
// ═══════════════════════════════════════════════════════════

let imageStore = {};

async function handleMessage(chatId, userText, clientImage) {
  try {
    console.log(`\n${'='.repeat(55)}`);
    console.log('  NOUVELLE COMMANDE PUBLICITAIRE');
    console.log(`  Client: ${chatId}`);
    console.log(`  Message: ${userText}`);
    console.log(`  Image: ${clientImage ? 'OUI' : 'NON'}`);
    console.log('='.repeat(55));

    await sendText(chatId,
      '🎬 *STUDIO PUB IA v11*\n\n' +
      '🧠 Directeur IA analyse votre produit...\n' +
      '✍️ Scénariste IA crée le script 5 scènes...\n' +
      '🎨 Créateur génère l\'image produit...\n' +
      '🎥 HeyGen crée la vidéo avec avatar ultra-réaliste...\n\n' +
      '⏳ ~5-8 minutes, votre spot arrive...');

    // AGENT 1 : DIRECTEUR
    const analyse = await directeurIA(userText, !!clientImage);

    // AGENT 2 : SCÉNARISTE
    const script = await scenaristeIA(analyse, !!clientImage);

    // AGENT 3 : CRÉATEUR D'IMAGES (si pas d'image client)
    let imageUrl = clientImage;
    if (!clientImage && script.image_prompt) {
      imageUrl = await createurImages(script.image_prompt);
    } else {
      console.log('[3/4] IMAGE fournie par le client');
    }

    // AGENT 4 : HEYGEN (avatar + voix + scènes = vidéo complète)
    const scenes = script.scenes || [];
    if (scenes.length === 0) throw new Error('Aucune scène générée');

    const videoUrl = await heygenIA(scenes, imageUrl);

    // LIVRAISON
    console.log('\n[LIVRAISON] Envoi WhatsApp...');

    const narrationFull = scenes.map(s => s.narration).join(' ');

    const caption =
      `🔥 ${script.hook}\n\n` +
      `✨ *${script.titre}*\n` +
      `💎 ${script.benefice}\n\n` +
      `🎙️ « ${narrationFull} »\n\n` +
      `👉 *${script.cta}*\n\n` +
      `📱 Prête pour Facebook • Instagram • TikTok\n` +
      `🎯 Cible : ${analyse.marche_cible}`;

    await sendVideo(chatId, videoUrl, caption);

    console.log('\n✅ PUB LIVRÉE!\n');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    await sendText(chatId,
      '⚠️ Erreur: ' + error.message + '\n\nRéessayez avec plus de détails.');
  }
}

// Route pour servir les images générées (arrière-plan HeyGen)
app.get('/img/:id', (req, res) => {
  const img = imageStore[req.params.id];
  if (!img) return res.status(404).send('Image expirée');
  const buffer = Buffer.from(img, 'base64');
  res.set({ 'Content-Type': 'image/png', 'Content-Length': buffer.length });
  res.send(buffer);
});

// ========== POLLING ==========

let isProcessing = false;

async function poll() {
  try {
    const res = await fetch(`${GREEN_API_URL}/receiveNotification/${GREEN_API_TOKEN}?receiveTimeout=5`);
    const text = await res.text();
    if (!text || text === 'null') return;

    const data = JSON.parse(text);
    if (!data?.receiptId) return;

    const body = data.body;
    const chatId = body?.senderData?.chatId || '';
    const sender = chatId.replace('@c.us', '');

    if (body?.typeWebhook === 'incomingMessageReceived' && !chatId.includes('@g.us')) {
      if (ALLOWED_NUMBERS.length === 0 || ALLOWED_NUMBERS.includes(sender)) {
        let userText = '';
        let imageUrl = null;
        const t = body?.messageData?.typeMessage || '';

        if (t === 'textMessage') {
          userText = body.messageData?.textMessageData?.textMessage || '';
        } else if (t === 'imageMessage') {
          userText = body.messageData?.fileMessageData?.caption || '';
          imageUrl = body.messageData?.fileMessageData?.downloadUrl || null;
          console.log('  Image reçue, downloadUrl:', imageUrl ? 'OUI' : 'NON');
          if (!userText || userText.trim().length < 5) {
            userText = 'Créer une publicité vidéo professionnelle pour ce produit';
          }
        } else if (t === 'extendedTextMessage') {
          userText = body.messageData?.extendedTextMessageData?.text || '';
        }

        userText = userText.trim();
        if (userText.length >= 5 && !isProcessing) {
          isProcessing = true;
          handleMessage(chatId, userText, imageUrl).finally(() => { isProcessing = false; });
        }
      }
    }

    await fetch(`${GREEN_API_URL}/deleteNotification/${GREEN_API_TOKEN}/${data.receiptId}`, { method: 'DELETE' });
  } catch (err) {
    if (!err.message?.includes('null')) console.error('Poll:', err.message);
  }
}

async function clearQueue() {
  console.log('Nettoyage file attente...');
  for (let i = 0; i < 200; i++) {
    try {
      const res = await fetch(`${GREEN_API_URL}/receiveNotification/${GREEN_API_TOKEN}?receiveTimeout=2`);
      const text = await res.text();
      if (!text || text === 'null') break;
      const data = JSON.parse(text);
      if (!data?.receiptId) break;
      await fetch(`${GREEN_API_URL}/deleteNotification/${GREEN_API_TOKEN}/${data.receiptId}`, { method: 'DELETE' });
    } catch { break; }
  }
  console.log('OK');
}

// ========== DÉMARRAGE ==========

app.get('/', (req, res) => res.json({
  version: 'Studio Pub IA v11.0 — HeyGen',
  pipeline: {
    directeur: 'OpenAI GPT-4o-mini',
    scenariste: 'OpenAI GPT-4o-mini',
    images: 'gpt-image-1 (DALL-E)',
    video: 'HeyGen (avatar + voix + montage)'
  }
}));

app.listen(PORT, async () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║     STUDIO PUB IA v11.0 — HeyGen    ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log('  ║  1. Directeur IA    → OpenAI GPT     ║');
  console.log('  ║  2. Scénariste IA   → OpenAI GPT     ║');
  console.log('  ║  3. Créateur Images → gpt-image-1    ║');
  console.log('  ║  4. HeyGen IA       → Avatar+Voix    ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');

  await clearQueue();
  console.log('  Polling WhatsApp actif (20s)\n');
  setInterval(poll, 20000);
});
