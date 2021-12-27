import { loadDb } from './functions/databases.js';
import text from './functions/hears.js';
import launch from './functions/commands.js';

(async () => {
  await loadDb();
  await text();
  await launch();
})();
