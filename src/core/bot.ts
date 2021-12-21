import { text } from "../functions/hears.js";
import { launch } from "../functions/commands.js";
import { loadDb } from "../functions/databases.js";

(async () => {
	await loadDb();
	await text();
	await launch();
})();
