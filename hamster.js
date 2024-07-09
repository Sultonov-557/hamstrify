import axios from "axios";

export class Hamster {
	axios;
	game = {};
	user = {};

	async post(url, data = {}) {
		try {
			const req = await this.axios.post(url, data);
			data = req.data;

			if (data.clickerUser) {
				this.user = data.clickerUser;
			}
			if (data.upgradesForBuy) {
				this.game.upgrades = data.upgradesForBuy;
			}
			if (data.clickerConfig) {
				this.game.clickerConfig = data.clickerConfig;
			}
			if (data.dailyCipher) {
				this.game.dailyCipher = data.dailyCipher;
			}
			if (data.feature) {
				this.game.feature = data.feature;
			}
			if (data.sections) {
				this.game.sections = data.sections;
			}
			if (data.dailyCombo) {
				this.game.dailyCombo = data.dailyCombo;
			}
			if (data.upgradesForBuy) {
				this.game.upgrades = data.upgradesForBuy;
			}
		} catch (e) {
			console.log(e, url);
		}
	}

	async update() {
		console.log("updating");
		await this.post("./sync");
		await this.post("./config");
		await this.post("./upgrades-for-buy");
		await this.post("./list-tasks");
	}

	GetCardToBuy() {
		return this.game.upgrades
			.filter((v) => !v.condition && v.price < this.user.balanceCoins && v.profitPerHour != 0 && !v.isExpired)
			.sort((a, b) => a.price / a.profitPerHourDelta - b.price / b.profitPerHourDelta)[0];
	}

	async tick() {
		//UPDATE
		await this.update();

		//CLAIM DAILY CIPHER
		if (!this.game.dailyCipher.isClaimed) {
			console.log("claiming cipher");
			const cipher = Buffer.from(`${this.game.dailyCipher.cipher.slice(0, 3)}${this.game.dailyCipher.cipher.slice(4)}`, "base64").toString();
			try {
				await this.post("./claim-daily-cipher", { cipher });
			} catch {}
		}

		//CLICK
		const data = {
			count: this.user.availableTaps,
			availableTaps: 0,
			timestamp: Math.floor(Date.now() / 1000),
		};
		console.log(`clicking ${data.count} times`);
		await this.post("./tap", data);

		//CARDS
		//153.3
		let cardToBuy = this.GetCardToBuy();
		while (cardToBuy.length != 0) {
			console.log(`buying card ${cardToBuy.name}`);
			if (cardToBuy.cooldownSeconds) await sleep(cardToBuy.cooldownSeconds * 1000);
			await this.post("./buy-upgrade", { timestamp: Math.floor(Date.now() / 1000), upgradeId: cardToBuy.id });
			cardToBuy = this.GetCardToBuy();
		}

		let out = "";
		out += `ID: ${this.user.id}\n`;
		out += `coins: ${this.user.balanceCoins}\n`;
		out += `EPH: ${this.user.earnPassivePerHour}\n`;
		out += `EPS: ${this.user.earnPassivePerSec}\n`;
		out += `taps: ${this.user.availableTaps}/${this.user.maxTaps} - ${this.user.tapsRecoverPerSec}TPS+\n`;
		out += "-".repeat(10);
		console.log(out);
	}

	async loop() {
		while (true) {
			await this.tick();
			await sleep(1000 * 60 * 5);
		}
	}

	constructor(TOKEN) {
		this.axios = axios.create({
			baseURL: "https://api.hamsterkombat.io/clicker",
			headers: { Authorization: TOKEN },
		});
		this.loop();
	}
}

function sleep(ms) {
	return new Promise((res) => {
		setTimeout(res, ms);
	});
}
