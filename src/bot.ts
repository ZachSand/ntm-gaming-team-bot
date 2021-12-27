import { loadDb } from './functions/databases.js';
import messageListener from './functions/hears.js';
import launch from './functions/commands.js';

(async () => {
  await loadDb();
  await messageListener();
  await launch();
})();
