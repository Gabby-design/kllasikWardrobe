// scripts/update-catalog-gallery.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../src/data/catalog.js');

let code = fs.readFileSync(catalogPath, 'utf8');

// Rich galleries for each product category
const customGalleries = {
  'kwt-01': [
    '/images/media__1786369656046.jpg',
    '/images/media__1786369661997.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-02': [
    '/images/media__1786370258071_2.jpg',
    '/images/media__1786370258071_3.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-03': [
    '/images/media__1786369606088.jpg',
    '/images/media__1786370258071_1.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-purple.png',
  ],
  'kwt-04': [
    '/images/media__1786369626673.jpg',
    '/images/media__1786369661997.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-white.png',
  ],
  'kwt-05': [
    '/images/media__1786369649479.jpg',
    '/images/media__1786370258071.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-white.png',
  ],
  'kwt-06': [
    '/images/media__1786370258071.jpg',
    '/images/media__1786369649479.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-white.png',
  ],
  'kwt-07': [
    '/images/media__1786370258071_1.jpg',
    '/images/media__1786369606088.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-08': [
    '/images/media__1786370258071_2.jpg',
    '/images/media__1786370258071_3.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-09': [
    '/images/media__1786369656046.jpg',
    '/images/media__1786369661997.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-10': [
    '/images/media__1786369661997.jpg',
    '/images/media__1786369656046.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-11': [
    '/images/media__1786369606088.jpg',
    '/images/media__1786370258071_1.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-purple.png',
  ],
  'kwt-12': [
    '/images/media__1786370258071_3.jpg',
    '/images/media__1786370258071_2.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-13': [
    '/images/media__1786369626673.jpg',
    '/images/media__1786369661997.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-white.png',
  ],
  'kwt-14': [
    '/images/media__1786369649479.jpg',
    '/images/media__1786370258071.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-white.png',
  ],
  'kwt-15': [
    '/images/media__1786370258071.jpg',
    '/images/media__1786369649479.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-white.png',
  ],
  'kwt-16': [
    '/images/media__1786370258071_1.jpg',
    '/images/media__1786369606088.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-purple.png',
  ],
  'kwt-17': [
    '/images/media__1786370258071_2.jpg',
    '/images/media__1786370258071_3.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-18': [
    '/images/media__1786369656046.jpg',
    '/images/media__1786369661997.jpg',
    '/images/detail-cotton-rib.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-jeans-01': [
    '/images/jeans-raw-indigo.jpg',
    '/images/detail-denim-selvedge.jpg',
    '/images/jeans-washed-black.jpg',
    '/images/media__1786369656046.jpg',
  ],
  'kwt-jeans-02': [
    '/images/jeans-washed-black.jpg',
    '/images/detail-denim-selvedge.jpg',
    '/images/jeans-raw-indigo.jpg',
    '/images/hero-tee-black.png',
  ],
  'kwt-short-01': [
    '/images/short-jeans-jorts.jpg',
    '/images/detail-jorts-frayed.jpg',
    '/images/detail-denim-selvedge.jpg',
    '/images/media__1786369626673.jpg',
  ],
  'kwt-beach-01': [
    '/images/beach-pants-linen.jpg',
    '/images/detail-linen-waistband.jpg',
    '/images/hero-tee-white.png',
    '/images/media__1786370258071.jpg',
  ],
};

for (const [id, imgs] of Object.entries(customGalleries)) {
  const reg = new RegExp(`id:\\s*'${id}'[\\s\\S]*?gallery:\\s*\\[[^\\]]*\\]`, 'm');
  const replacementLines = 'gallery: [\n      ' + imgs.map(i => `'${i}'`).join(',\n      ') + ',\n    ]';
  code = code.replace(reg, (match) => {
    return match.replace(/gallery:\s*\[[^\]]*\]/, replacementLines);
  });
}

fs.writeFileSync(catalogPath, code, 'utf8');
console.log('Successfully updated catalog gallery arrays with 4 detail images each!');
