import { readFileSync } from "fs";
import { Hamster } from "./hamster.js";

const tokens = JSON.parse(readFileSync("./tokens.json").toString());

for (let token of tokens) {
  const hamster = new Hamster(token);
  setInterval(() => hamster.update(), 1000 * 60 * 3);
}
