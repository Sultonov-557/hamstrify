import { readFileSync } from "fs";
import { Hamster } from "./hamster.js";

const tokens = JSON.parse(readFileSync("./tokens.json", "utf-8"));

const updateInterval = 1000 * 60 * 3; // 3 minutes in milliseconds

const hamsters = tokens.map((token) => new Hamster(token));

function updateHamsters() {
	hamsters.forEach((hamster) => hamster.update());
}

setInterval(updateHamsters, updateInterval);

// Initial update
updateHamsters();
