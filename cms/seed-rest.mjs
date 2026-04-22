// Seed Litters, Puppies, GalleryItems by parsing existing HTML.
// Run from cms/ with Payload dev server running.

import fs from 'fs'
import path from 'path'

const API = 'http://localhost:3000/api'
const EMAIL = 'krallarissa@gmail.com'
const PASSWORD = 'ChatobrianChoco'
const ROOT = path.resolve('..')

async function login() {
  const r = await fetch(`${API}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const j = await r.json()
  if (!j.token) throw new Error('Login failed: ' + JSON.stringify(j))
  return j.token
}

// cache: filename -> media id (so we don't re-upload shared files like mateo.jpg)
const mediaCache = new Map()

async function ensureMedia(token, filename, alt) {
  if (mediaCache.has(filename)) return mediaCache.get(filename)
  // check if media already exists
  const q = await fetch(
    `${API}/media?where[filename][equals]=${encodeURIComponent(filename)}&limit=1`,
    { headers: { Authorization: `JWT ${token}` } }
  )
  const qj = await q.json()
  if (qj.docs?.[0]?.id) {
    mediaCache.set(filename, qj.docs[0].id)
    return qj.docs[0].id
  }
  const filePath = path.join(ROOT, filename)
  if (!fs.existsSync(filePath)) {
    console.log('  ⚠ missing file', filename)
    return null
  }
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filename).slice(1).toLowerCase()
  const mime =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  const form = new FormData()
  form.append('file', new Blob([buf], { type: mime }), filename)
  form.append('_payload', JSON.stringify({ alt }))
  const r = await fetch(`${API}/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: form,
  })
  const j = await r.json()
  if (!j.doc?.id) {
    console.log('  ⚠ upload failed for', filename, JSON.stringify(j).slice(0, 200))
    return null
  }
  mediaCache.set(filename, j.doc.id)
  console.log('  ✓ uploaded', filename, '→ id', j.doc.id)
  return j.doc.id
}

async function clearCollection(token, slug) {
  const r = await fetch(`${API}/${slug}?limit=500`, {
    headers: { Authorization: `JWT ${token}` },
  })
  const j = await r.json()
  for (const d of j.docs) {
    await fetch(`${API}/${slug}/${d.id}`, {
      method: 'DELETE',
      headers: { Authorization: `JWT ${token}` },
    })
  }
  console.log(`  ✗ cleared ${slug} (${j.docs.length} docs)`)
}

async function create(token, collection, data) {
  const r = await fetch(`${API}/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  })
  const j = await r.json()
  if (!j.doc?.id) throw new Error(`Create ${collection} failed: ` + JSON.stringify(j).slice(0, 300))
  return j.doc
}

/* ───── SEED LITTERS ───── */
const littersData = [
  {
    name: 'Vrh C',
    slug: 'vrh-c',
    status: 'available',
    cover: 'VRH_C.jpg',
    description: 'Štěňata z vrhu C naší chovatelské stanice.',
    sire: 'JCH Earl Matteo Angel Of My Heart',
    dame: 'Oxygen Fresh Stream',
    dob: '27.12.2025',
    order: 1,
  },
  {
    name: 'Vrh B',
    slug: 'vrh-b',
    status: 'unavailable',
    cover: 'VRH_B.jpg',
    description: 'Štěňata z vrhu B naší chovatelské stanice.',
    sire: 'C.I.B. Kind Of Love Srebrne Marzenie',
    dame: 'Ti Amo Romantico Senorita',
    order: 2,
  },
  {
    name: 'Vrh A',
    slug: 'vrh-a',
    status: 'unavailable',
    cover: 'VRH_A.jpg',
    description: 'Štěňata z vrhu A naší chovatelské stanice.',
    sire: 'JCH Earl Matteo Angel Of My Heart',
    dame: 'Oxygen Fresh Stream',
    dob: '29.6.2024',
    order: 3,
  },
]

/* ───── SEED PUPPIES ───── */
const puppiesData = [
  {
    name: 'Citrine',
    slug: 'citrine',
    gender: 'female',
    status: 'available',
    photo: 'Citrine.jpg',
    litterSlug: 'vrh-c',
    order: 1,
  },
  {
    name: 'Coral',
    slug: 'coral',
    gender: 'male',
    status: 'available',
    photo: 'Coral.jpg',
    litterSlug: 'vrh-c',
    order: 2,
  },
]

/* ───── SEED GALLERY ITEMS ───── */
function parseGalleryHtml() {
  const html = fs.readFileSync(path.join(ROOT, 'galerie.html'), 'utf8')
  // match each gallery-item div (including `wide` variant)
  const itemRe =
    /<div class="gallery-item([^"]*)"[^>]*data-category="([^"]+)"[^>]*data-caption="([^"]+)"[^>]*>\s*<img src="([^"]+)"[^>]*(?:object-position:\s*([^;"]+))?[^>]*\/>/g
  const items = []
  let m
  while ((m = itemRe.exec(html)) !== null) {
    const classes = m[1]
    const category = m[2].replace(/^psi /, '').trim() // "psi senorita" → "senorita", "stenata" stays
    const caption = m[3]
    const src = m[4]
    const objPos = (m[5] || 'center center').trim()
    items.push({
      wide: classes.includes('wide'),
      category,
      caption,
      src,
      objectPosition: objPos,
    })
  }
  return items
}

/* ───── RUN ───── */
console.log('→ Login')
const token = await login()

console.log('\n→ Seed Litters')
await clearCollection(token, 'litters')
const litterIds = {}
for (const L of littersData) {
  console.log('·', L.name)
  const coverId = L.cover ? await ensureMedia(token, L.cover, L.name) : null
  const doc = await create(token, 'litters', { ...L, cover: coverId ?? undefined })
  litterIds[L.slug] = doc.id
  console.log('  ✓', L.name)
}

console.log('\n→ Seed Puppies')
await clearCollection(token, 'puppies')
for (const P of puppiesData) {
  console.log('·', P.name)
  const photoId = await ensureMedia(token, P.photo, P.name)
  const { photo, litterSlug, ...rest } = P
  await create(token, 'puppies', {
    ...rest,
    photo: photoId ?? undefined,
    litter: litterIds[litterSlug],
  })
  console.log('  ✓', P.name)
}

console.log('\n→ Seed Gallery')
await clearCollection(token, 'gallery-items')
const items = parseGalleryHtml()
console.log(`  parsed ${items.length} items from galerie.html`)
let idx = 0
for (const it of items) {
  idx++
  const photoId = await ensureMedia(token, it.src, it.caption)
  if (!photoId) continue
  await create(token, 'gallery-items', {
    caption: it.caption,
    category: it.category,
    photo: photoId,
    wide: it.wide,
    objectPosition: it.objectPosition,
    order: idx,
  })
  process.stdout.write(`\r  ✓ ${idx}/${items.length}`)
}
console.log('\n\n✓ Done.')
