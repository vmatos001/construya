import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Algolia config extraído de window.algoliaConfig de sv.epaenlinea.com
const ALGOLIA_APP_ID    = "D8WPXV9MEC";
const ALGOLIA_API_KEY   = "MmIxYjA5Y2Y5ZDU5NzdlNWYyMTRiODUwN2RkOGI3NTU0ODUwOGY0Mzk4ZjgyNzY5NGNmOTZiOTdlM2QyZTMzNnRhZ0ZpbHRlcnM9";
const ALGOLIA_INDEX     = "prodsv_Soyapango_products";
const ALGOLIA_URL       = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
const EPA_BASE          = "https://sv.epaenlinea.com";
const PAGE_SIZE         = 100;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface AlgoliaProduct {
  objectID:    string;
  name:        string;
  sku:         string;
  url:         string;
  image_url?:  string;
  in_stock:    boolean;
  price:       { USD: { default: number; default_original_price?: number } };
  categories_without_path?: string[];
  marca?:      string;
}

// --- Fetch one page from Algolia ---
async function fetchAlgoliaPage(page: number): Promise<{ hits: AlgoliaProduct[]; nbPages: number }> {
  const resp = await fetch(ALGOLIA_URL, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": ALGOLIA_APP_ID,
      "X-Algolia-API-Key":        ALGOLIA_API_KEY,
      "Content-Type":             "application/json",
    },
    body: JSON.stringify({
      params: `hitsPerPage=${PAGE_SIZE}&page=${page}&numericFilters=visibility_search%3D1&attributesToRetrieve=objectID,name,sku,url,thumbnail_url,image_url,in_stock,price,categories_without_path,marca`,
    }),
  });
  if (!resp.ok) throw new Error(`Algolia error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return { hits: data.hits, nbPages: data.nbPages };
}

// --- Match to banco_precios ---
async function matchBancoPrecio(sku: string, nombre: string): Promise<string | null> {
  // 1. SKU exacto
  const { data: s } = await supabase.from("banco_precios").select("id").eq("codigo", sku).single();
  if (s) return s.id;
  // 2. Primeras 3 palabras del nombre
  const words = nombre.split(" ").slice(0, 3).join(" ");
  const { data: n } = await supabase.from("banco_precios").select("id").ilike("descripcion", `%${words}%`).limit(1).single();
  return n?.id ?? null;
}

// --- Main handler ---
Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const urlTest = new URL(req.url).searchParams.get("test") === "true";
  let bodyTest = false;
  try { const b = await req.json(); bodyTest = !!b?.test; } catch { /* no body */ }
  const isTest = urlTest || bodyTest;

  // Obtener fuente_id de EPA
  const { data: fuente, error: fErr } = await supabase
    .from("ferreteria_fuentes").select("id").eq("nombre", "epa").single();
  if (fErr || !fuente) return new Response("Fuente EPA no encontrada", { status: 500 });
  const fuente_id = fuente.id;

  let inserted = 0, errors = 0, totalProducts = 0;

  try {
    // Primera página para saber cuántas hay
    const first = await fetchAlgoliaPage(0);
    const nbPages = isTest ? 1 : first.nbPages;
    console.log(`EPA Algolia: ${nbPages} páginas (~${nbPages * PAGE_SIZE} productos)`);

    const allHits: AlgoliaProduct[] = [...first.hits];

    // Fetch páginas restantes en batches de 5
    if (!isTest) {
      for (let p = 1; p < nbPages; p += 5) {
        const batch = Array.from({ length: Math.min(5, nbPages - p) }, (_, i) => fetchAlgoliaPage(p + i));
        const pages = await Promise.all(batch);
        pages.forEach(pg => allHits.push(...pg.hits));
        await new Promise(r => setTimeout(r, 500));
      }
    }

    totalProducts = allHits.length;

    // Insertar en banco_precios_fuentes
    const rows = await Promise.all(allHits.map(async (hit) => {
      const precio = hit.price?.USD?.default;
      if (!precio) return null;

      const banco_precio_id = await matchBancoPrecio(hit.sku, hit.name);

      return {
        fuente_id,
        banco_precio_id,
        sku_externo:   hit.sku,
        raw_sku:       hit.sku,
        raw_nombre:    hit.name,
        url_producto:  hit.url?.startsWith("http") ? hit.url : `${EPA_BASE}/${hit.url}`,
        precio,
        disponible:    !!hit.in_stock,
        fecha_scrape:  new Date().toISOString(),
      };
    }));

    const validRows = rows.filter(Boolean);

    if (isTest) {
      // En test: solo loguear sin insertar
      console.log("TEST sample:", JSON.stringify(validRows.slice(0, 3), null, 2));
      inserted = validRows.length;
    } else {
      // Upsert en lotes de 200
      for (let i = 0; i < validRows.length; i += 200) {
        const { error } = await supabase
          .from("banco_precios_fuentes")
          .insert(validRows.slice(i, i + 200));
        if (error) { console.error(error); errors++; }
        else inserted += Math.min(200, validRows.length - i);
      }
    }

    // Actualizar fuente
    await supabase.from("ferreteria_fuentes").update({
      ultimo_scrape: new Date().toISOString(),
      status: "ok",
    }).eq("id", fuente_id);

    return new Response(
      JSON.stringify({ ok: true, totalProducts, inserted, errors, pages: nbPages, test: isTest }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error(e);
    await supabase.from("ferreteria_fuentes").update({ status: "error" }).eq("id", fuente_id);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
});
