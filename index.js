import tokens from "./tokens.json" assert { type: "json" };
import { Hamster } from "./hamster.js";

for (let token of tokens) {
	const hamster = new Hamster(token);
	setInterval(() => hamster.update(), 1000 * 60 * 3);
}
