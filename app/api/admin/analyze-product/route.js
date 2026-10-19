import { NextResponse } from 'next/server.js';
import { cookies } from 'next/headers.js';
import { verifyAdminSessionToken } from '../../../../src/lib/auth.js';

export const dynamic = 'force-dynamic';

async function isAdminAuthorized(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    if (token && verifyAdminSessionToken(token)) return true;
  } catch {}

  const authHeader = request?.headers?.get?.('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (verifyAdminSessionToken(bearer)) return true;
  }
  return false;
}

// Map detected category to known brand categories
function normalizeCategory(raw) {
  if (!raw || typeof raw !== 'string') return 'T-Shirts';
  const c = raw.toLowerCase().trim();
  if (c.includes('up and down') || c.includes('up & down') || c.includes('co-ord') || c.includes('set') || c.includes('two-piece') || c.includes('tracksuit')) {
    return 'Up and Down';
  }
  if (c.includes('long sleeve') || c.includes('long-sleeve') || c.includes('longsleeve')) {
    return 'Long Sleeves';
  }
  if (c.includes('cargo')) {
    return 'Cargo Pants';
  }
  if (c.includes('jort') || c.includes('short jean') || (c.includes('short') && c.includes('denim'))) {
    return 'Short Jeans';
  }
  if (c.includes('beach') || c.includes('linen')) {
    return 'Beach Pants';
  }
  if (c.includes('jean') || c.includes('denim')) {
    return 'Jeans';
  }
  if (c.includes('tee') || c.includes('shirt') || c.includes('t-shirt') || c.includes('top')) {
    return 'T-Shirts';
  }
  return raw.trim();
}

export async function POST(request) {
  const isAuth = await isAdminAuthorized(request);
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { imageUrl, fileName, mimeType, customApiKey } = body;

    const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    let aiResult = null;

    if (apiKey && (imageUrl || body.base64)) {
      try {
        let base64Data = body.base64;
        let mime = mimeType || 'image/jpeg';

        // Fetch image bytes if URL provided and base64 not provided
        if (!base64Data && imageUrl && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
          const fetchImg = await fetch(imageUrl);
          if (fetchImg.ok) {
            const buf = await fetchImg.arrayBuffer();
            base64Data = Buffer.from(buf).toString('base64');
            mime = fetchImg.headers.get('content-type') || mime;
          }
        }

        if (base64Data) {
          const prompt = `You are a professional luxury streetwear e-commerce director for "Klasik Wardrobe".
Carefully analyze this garment image. Return ONLY a valid JSON object (no markdown fences, no explanatory text):
{
  "title": "A compelling product title starting with 'Klasik ' (e.g. 'Klasik Heavyweight Layered Long-Sleeve Tee', 'Klasik Vintage Washed Cargo Pants', 'Klasik Heavyweight Co-Ord Utility Set')",
  "category": Exactly one of ["T-Shirts", "Long Sleeves", "Jeans", "Cargo Pants", "Short Jeans", "Beach Pants", "Up and Down"],
  "tag": A punchy badge tag (e.g. "New Drop", "Layered Drop", "Co-Ord Drop", "Tactical Drop", "Vintage Wash", "Luxury Tier"),
  "price": Recommended price in Nigerian Naira as an integer:
    - T-Shirts: 30000 - 38000
    - Long Sleeves: 35000 - 45000
    - Jeans: 60000 - 75000
    - Cargo Pants: 45000 - 55000
    - Short Jeans: 35000 - 45000
    - Beach Pants: 45000 - 52000
    - Up and Down (co-ord set / matching two-piece): 55000 - 75000,
  "gsm": "Fabric weight string (e.g. '260 GSM Heavyweight Cotton', '14.5oz Japanese Selvedge Denim', '280 GSM Combat Cotton Twill', '240 GSM Pure Linen')",
  "material": "Material composition (e.g. '100% Combed Organic Cotton', '100% Premium Cotton Denim', '100% Washed Cotton Twill')",
  "fit": "Silhouette description (e.g. 'Oversized Drop-Shoulder', 'Relaxed Straight Leg', 'Boxy Overshirt & Relaxed Shorts', 'Baggy Knee-Length')",
  "description": "2-3 sentences of elevated fashion e-commerce description detailing the piece's texture, stitching, cut, and streetwear styling.",
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "colors": [
    { "name": "Color Name (e.g. Washed Charcoal, Obsidian Black, Sand Khaki)", "hex": "#111111" }
  ]
}

Classification rules:
- Matching two-piece outfit (top + matching shorts/pants) must be "Up and Down".
- Long-sleeve t-shirt or double-layered sleeve t-shirt must be "Long Sleeves".
- Short-sleeve t-shirt, ringer, or polo shirt must be "T-Shirts".
- Pants with flap/cargo/utility pockets on thighs must be "Cargo Pants".
- Full-length denim must be "Jeans".
- Denim shorts or cutoffs must be "Short Jeans".
- Linen or relaxed flowy trousers must be "Beach Pants".`;

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const aiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: mime,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanText = rawText.replace(/```json\s*|\s*```/g, '').trim();
              aiResult = JSON.parse(cleanText);
            }
          }
        }
      } catch (geminiErr) {
        console.warn('[Analyze API] Gemini AI notice:', geminiErr.message);
      }
    }

    // Heuristic & Smart Rule-Based Engine (acts as intelligent fallback when API key is offline)
    if (!aiResult) {
      const nameLower = (fileName || imageUrl || '').toLowerCase();
      
      let category = 'T-Shirts';
      let title = 'Klasik Heavyweight Streetwear Piece';
      let price = 35000;
      let tag = 'New Drop';
      let gsm = '240 GSM Heavyweight';
      let material = '100% Combed Organic Cotton';
      let fit = 'Oversized Drop-Shoulder';
      let desc = 'Crafted from luxury combed cotton with intentional drop-shoulder drape and durable ribbing.';
      let colors = [{ name: 'Obsidian Black', hex: '#111111' }];

      if (nameLower.includes('up-and-down') || nameLower.includes('coord') || nameLower.includes('set') || nameLower.includes('two-piece') || nameLower.includes('tracksuit')) {
        category = 'Up and Down';
        title = 'Klasik Heavyweight Textured Boxy Co-Ord Set';
        price = 58000;
        tag = 'Co-Ord Drop';
        gsm = '280 GSM Heavyweight Washed Twill';
        material = '100% Premium Washed Cotton Twill';
        fit = 'Boxy Overshirt & Relaxed Utility Shorts';
        desc = 'Luxury two-piece matching co-ord set featuring a boxy cropped utility button-up overshirt and matching relaxed shorts in washed heavyweight twill.';
        colors = [{ name: 'Washed Charcoal', hex: '#333333' }];
      } else if (nameLower.includes('long-sleeve') || nameLower.includes('longsleeve') || nameLower.includes('layered')) {
        category = 'Long Sleeves';
        title = 'Klasik Layered Graphic Long-Sleeve Tee';
        price = 35000;
        tag = 'Layered Drop';
        gsm = '260 GSM Heavyweight Cotton';
        material = '100% Combed Cotton with Ribbed Striped Undersleeve';
        fit = 'Layered Double-Sleeve Streetwear Fit';
        desc = '260 GSM double-layer streetwear long-sleeve tee featuring bold chest graphics and contrasting ribbed thermal undersleeves.';
        colors = [{ name: 'Washed Charcoal', hex: '#27272a' }, { name: 'Heather Grey', hex: '#9ca3af' }];
      } else if (nameLower.includes('cargo') || nameLower.includes('tactical')) {
        category = 'Cargo Pants';
        title = 'Klasik Heavyweight Tactical Cargo Pants';
        price = 45000;
        tag = 'Tactical Drop';
        gsm = '280 GSM Combat Cotton Twill';
        material = '100% Military Grade Cotton Twill';
        fit = 'Relaxed Straight-Leg Cargo';
        desc = 'Constructed from high-density 280 GSM military twill cotton with dual deep bellow cargo flap pockets and reinforced knee panels.';
        colors = [{ name: 'Tactical Black', hex: '#18181b' }, { name: 'Desert Khaki', hex: '#8a7967' }];
      } else if (nameLower.includes('jort') || nameLower.includes('short')) {
        category = 'Short Jeans';
        title = 'Klasik Vintage Washed Denim Jorts';
        price = 45000;
        tag = 'Summer Jorts';
        gsm = '13oz Heavyweight Denim';
        material = '100% Vintage Washed Cotton';
        fit = 'Baggy Knee-Length Jorts';
        desc = '13oz heavyweight vintage washed denim shorts with signature raw frayed hem and relaxed baggy streetwear silhouette.';
        colors = [{ name: 'Vintage Sky Wash', hex: '#93c5fd' }];
      } else if (nameLower.includes('linen') || nameLower.includes('beach')) {
        category = 'Beach Pants';
        title = 'Klasik Relaxed Pure Linen Beach Pants';
        price = 50000;
        tag = 'Pure Linen';
        gsm = '240 GSM Pure Flax Linen';
        material = '100% Breathable European Linen';
        fit = 'Relaxed Wide-Leg Flow';
        desc = 'Tailored from 240 GSM pure European flax linen with elasticated drawstring waistband and breathable flowy silhouette.';
        colors = [{ name: 'Ivory Cream', hex: '#f5f5f4' }];
      } else if (nameLower.includes('jean') || nameLower.includes('denim')) {
        category = 'Jeans';
        title = 'Klasik Vintage Distressed Baggy Jeans';
        price = 65000;
        tag = 'Luxury Denim';
        gsm = '14.5oz Heavyweight Denim';
        material = '100% Shuttle-Loom Selvedge Cotton';
        fit = 'Relaxed Straight Leg';
        desc = 'Crafted from 14.5oz Japanese shuttle-loom selvedge denim featuring relaxed straight drape and antique brass hardware.';
        colors = [{ name: 'Raw Indigo', hex: '#1e3a8a' }, { name: 'Washed Black', hex: '#262626' }];
      }

      aiResult = {
        title,
        category,
        price,
        tag,
        gsm,
        material,
        fit,
        description: desc,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors,
      };
    }

    // Ensure category matches valid brand names
    aiResult.category = normalizeCategory(aiResult.category);

    return NextResponse.json({
      success: true,
      analysis: aiResult,
      source: apiKey ? 'gemini-vision' : 'smart-heuristics',
    });
  } catch (err) {
    console.error('[Analyze API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze product' }, { status: 500 });
  }
}
