import tokens from "./tokens.json" assert { type: "json" };
import { Hamster } from "./hamster.js";

for (let token of tokens) {
	new Hamster(token);
}
