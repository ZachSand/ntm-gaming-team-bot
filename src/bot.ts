import { loadDb } from './functions/databases.js';
import messageListener from './functions/commands.js';
import launch from './functions/login.js';

(async () => {
  await loadDb();
  await messageListener();
  await launch();
})();
