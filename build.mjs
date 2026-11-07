// Build entry (stub). Rendering is added in a later task.
import { loadContent } from './src/lib/content.mjs';

for (const lang of ['en', 'it']) {
  try {
    const c = await loadContent(lang);
    console.log(`${lang}: ${c.pages.length} pages, ${c.products.length} products, ${c.services.length} services`);
  } catch (e) {
    console.error(`${lang}: ${e.message}`);
    process.exitCode = 1;
  }
}
