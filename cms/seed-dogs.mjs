// Seed script for Dogs collection
// Run: node seed-dogs.mjs (from cms/ folder, with Payload dev server running)

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

async function uploadMedia(token, filename, alt) {
  const filePath = path.join(ROOT, filename)
  const buf = fs.readFileSync(filePath)
  const form = new FormData()
  const ext = path.extname(filename).slice(1).toLowerCase()
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
  form.append('file', new Blob([buf], { type: mime }), filename)
  form.append('_payload', JSON.stringify({ alt }))
  const r = await fetch(`${API}/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: form,
  })
  const j = await r.json()
  if (!j.doc?.id) throw new Error('Upload failed for ' + filename + ': ' + JSON.stringify(j))
  console.log('  ✓ uploaded', filename, '→ id', j.doc.id)
  return j.doc.id
}

async function createDog(token, data) {
  const r = await fetch(`${API}/dogs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  })
  const j = await r.json()
  if (!j.doc?.id) throw new Error('Create failed: ' + JSON.stringify(j))
  console.log('  ✓ created dog', data.name)
  return j.doc
}

async function clearExisting(token) {
  const r = await fetch(`${API}/dogs?limit=100`, {
    headers: { Authorization: `JWT ${token}` },
  })
  const j = await r.json()
  for (const d of j.docs) {
    await fetch(`${API}/dogs/${d.id}`, {
      method: 'DELETE',
      headers: { Authorization: `JWT ${token}` },
    })
    console.log('  ✗ deleted existing', d.name)
  }
}

const dogs = [
  {
    name: 'Ti Amo Romantico Senorita',
    slug: 'senorita',
    gender: 'female',
    breed: 'Yorkshire teriér',
    health: 'V pořádku',
    description:
      'Nádherná fena s výjimečně hedvábnou srstí a typickým výstavním výrazem. Senorita je elegantní, temperamentní a plná energie.',
    photoFile: 'York1.jpg',
    order: 1,
    achievements: [
      { title: 'Posudek z výstavy', detail: 'Ti Amo Romantico Senorita', medal: null },
    ],
  },
  {
    name: 'Enchanting Michelle Angel Of My Heart',
    slug: 'michelle',
    gender: 'female',
    breed: 'Yorkshire teriér',
    health: 'V pořádku',
    description:
      'Okouzlující fena s nádhernou srstí a výraznou osobností. Michelle je elegantní, klidná a do každého vrhu předává ty nejlepší vlastnosti.',
    photoFile: 'topfoto.jpg',
    order: 2,
    achievements: [
      { title: 'Certifikát z výstavy', detail: '25. 11. 2023', medal: null },
      { title: 'Certifikát z výstavy', detail: '25. 11. 2023', medal: null },
      { title: 'Certifikát z výstavy', detail: '01. 06. 2024', medal: null },
    ],
  },
  {
    name: 'Oxygen Fresh Stream',
    slug: 'oxygen',
    gender: 'female',
    breed: 'Yorkshire teriér',
    health: 'V pořádku',
    description:
      'Elegantní fena s výjimečnou povahou a nádhernou srstí. Oxygen Fresh Stream je klidná, laskavá a svým potomkům předává ty nejlepší vlastnosti.',
    photoFile: 'oxygen_foto2.png',
    order: 3,
    achievements: [
      { title: 'Diplom „Триумф" – Národní výstava CAC', detail: 'Starý Oskol · 05. 09. 2021', medal: 'gold' },
      { title: 'Diplom – Národní výstava CAC / Champion Federace', detail: 'Gubkin · 04. 09. 2021', medal: 'gold' },
    ],
  },
  {
    name: 'Earl Matteo Angel Of My Heart',
    slug: 'matteo',
    gender: 'male',
    breed: 'Yorkshire teriér',
    titles: 'JCH EARL',
    health: 'V pořádku',
    description:
      'Výjimečný pes s titulem Junior Champion. Matteo disponuje dokonalou stavbou těla, nádhernou srstí a sebevědomou povahou výstavního psa nejvyšší kvality.',
    photoFile: 'mateo.jpg',
    order: 4,
    achievements: [
      { title: 'Junior Autumn Winner 2023', detail: 'Bosna a Hercegovina · říjen 2023', medal: 'gold' },
      { title: 'Autumn Winner 2023', detail: 'Bosna a Hercegovina · říjen 2023', medal: 'gold' },
      { title: 'Certifikát z výstavy', detail: '28. 10. 2023', medal: null },
      { title: 'Rozhodčí zpráva', detail: '28. 10. 2023', medal: null },
      { title: 'Certifikát z výstavy', detail: '28. 10. 2023', medal: null },
      { title: 'Certifikát z výstavy', detail: '29. 10. 2023', medal: null },
      { title: 'Certifikát z výstavy', detail: '29. 10. 2023', medal: null },
      { title: 'Certifikát z výstavy', detail: '25. 11. 2023', medal: null },
    ],
  },
]

console.log('→ Logging in…')
const token = await login()
console.log('  ✓ token acquired')

console.log('→ Clearing existing dogs…')
await clearExisting(token)

console.log('→ Seeding dogs…')
for (const d of dogs) {
  console.log('·', d.name)
  const photoId = await uploadMedia(token, d.photoFile, d.name)
  const { photoFile, achievements, ...rest } = d
  await createDog(token, {
    ...rest,
    photo: photoId,
    achievements: achievements.map(a => ({ ...a, medal: a.medal ?? undefined })),
  })
}

console.log('\n✓ Done.')
