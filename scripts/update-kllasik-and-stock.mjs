import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../src/data/catalog.js');

let content = fs.readFileSync(catalogPath, 'utf8');

// 1. Replace Klassic / Klasik with Kllasik
content = content.replace(/Klassic/g, 'Kllasik');
content = content.replace(/Klasik/g, 'Kllasik');

// Stock mapping per item
const stockMap = {
  'kwt-01': 6,
  'kwt-02': 4,
  'kwt-03': 1,
  'kwt-04': 12,
  'kwt-05': 5,
  'kwt-06': 1,
  'kwt-07': 8,
  'kwt-08': 3,
  'kwt-09': 1,
  'kwt-10': 10,
  'kwt-11': 7,
  'kwt-12': 2,
  'kwt-13': 9,
  'kwt-14': 4,
  'kwt-15': 1,
  'kwt-16': 6,
  'kwt-17': 1,
  'kwt-18': 5,
  'kwt-jeans-01': 8,
  'kwt-jeans-02': 3,
  'kwt-short-01': 1,
  'kwt-beach-01': 6
};

// Add stock property to each product block if not already present
for (const [id, stock] of Object.entries(stockMap)) {
  const idRegex = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?)(price:\\s*\\d+,)`);
  if (idRegex.test(content) && !content.includes(`id: '${id}'`) && content.includes(`stock:`)) {
    // Already has stock
  } else {
    content = content.replace(idRegex, `$1price: $2\n    stock: ${stock},`);
    // Remove duplicate price: price: if created
    content = content.replace(`price: price:`, `price:`);
  }
}

fs.writeFileSync(catalogPath, content, 'utf8');
console.log('Successfully updated catalog.js with Kllasik spelling and stock values.');
