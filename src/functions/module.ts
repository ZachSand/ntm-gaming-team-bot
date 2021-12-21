import { ModuleInterface, ModuleResponseInterface } from "../types/module.js";

export const m = async ({ text }: ModuleInterface): Promise<ModuleResponseInterface> => {
	const app = () => text;
	return {
		app,
	};
};
