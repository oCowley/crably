/**
 * Otimiza as imagens pesadas da landing e gera o og-image.png.
 * Uso: node scripts/optimize-images.mjs
 * (usa o sharp já presente em node_modules como dependência do Next)
 */
import sharp from 'sharp'
import { statSync } from 'node:fs'

const kb = (p) => Math.round(statSync(p).size / 1024) + ' KB'

// Mockups do hero: renderizados a no máx. 600px (1200px @2x)
for (const name of ['dark-note', 'light-note']) {
  const src = `public/images/${name}.png`
  const out = `public/images/${name}.webp`
  await sharp(src)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(out)
  console.log(`${src} (${kb(src)}) -> ${out} (${kb(out)})`)
}

// Foto da equipe: renderizada a ~720px (1440px @2x)
{
  const src = 'public/images/owners.png'
  const out = 'public/images/owners.webp'
  await sharp(src)
    .resize({ width: 1440, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(out)
  console.log(`${src} (${kb(src)}) -> ${out} (${kb(out)})`)
}

// OG image: PNG 1200x630 a partir do SVG (scrapers de OG não renderizam SVG)
{
  const src = 'public/images/og-image.svg'
  const out = 'public/images/og-image.png'
  await sharp(src, { density: 150 })
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`${src} -> ${out} (${kb(out)})`)
}
