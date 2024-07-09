import axios from "axios";

export class Hamster {
	axios;
	game = {};
	user = {};

	async post(url, data = {}) {
		try {
			const req = await this.axios.post(url, data);
			data = req.data;

			if (data.telegramUser) {
				this.TGUser = data.telegramUser;
			}
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
			console.log(e.data?.error_message || e.code || e, url);
		}
	}

	async update() {
		await this.post("./sync");
		await this.post("./config");
		await this.post("./upgrades-for-buy");
		await this.post("./list-tasks");
		await this.post("../auth/me-telegram");
	}

	GetCardToBuy() {
		return this.game.upgrades
			.filter((v) => !v.condition && v.price < this.user.balanceCoins && v.profitPerHourDelta != 0 && !v.isExpired && !v.cooldownSeconds)
			.sort((a, b) => a.price / a.profitPerHourDelta - b.price / b.profitPerHourDelta)[0];
	}

	async tick() {
		//UPDATE
		await this.update();
		let out = "";
		out += `NAME: ${this.TGUser.firstName}\n`;
		out += `coins: ${parseInt(this.user.balanceCoins)}\n`;
		out += `EPH: ${this.user.earnPassivePerHour}\n`;
		out += `EPS: ${this.user.earnPassivePerSec}\n`;
		out += `taps: ${this.user.availableTaps}/${this.user.maxTaps} - ${this.user.tapsRecoverPerSec}TPS+\n`;
		out += "-".repeat(10);
		console.log(out);

		//CLAIM DAILY CIPHER
		if (!this.game.dailyCipher.isClaimed) {
			console.log(`${this.TGUser.firstName}: claiming cipher for`);
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
		await this.post("./tap", data);

		//CARDS
		if (this.user.balanceCoins > this.game.upgrades.reduce((p, v) => p + v.price, 0) / this.game.upgrades.length) {
			let cardToBuy = this.GetCardToBuy();
			while (cardToBuy) {
				console.log(`${this.TGUser.firstName}: buying card ${cardToBuy.name}`);
				await this.post("./buy-upgrade", { timestamp: Math.floor(Date.now() / 1000), upgradeId: cardToBuy.id });
				cardToBuy = this.GetCardToBuy();
			}
		}

		out = "";
		out += `NAME: ${this.TGUser.firstName}\n`;
		out += `coins: ${parseInt(this.user.balanceCoins)}\n`;
		out += `EPH: ${this.user.earnPassivePerHour}\n`;
		out += `EPS: ${this.user.earnPassivePerSec}\n`;
		out += `taps: ${this.user.availableTaps}/${this.user.maxTaps} - ${this.user.tapsRecoverPerSec}TPS+\n`;
		out += "-".repeat(10);
		console.log(out);

		const sleepTime = parseInt((this.user.maxTaps - this.user.availableTaps) / this.user.tapsRecoverPerSec);
		console.log(`waiting for ${sleepTime} seconds`);
		await sleep(sleepTime * 1000);
		this.tick();
	}

	constructor(TOKEN) {
		this.axios = axios.create({
			baseURL: "https://api.hamsterkombat.io/clicker",
			headers: { Authorization: TOKEN },
		});
		this.tick();
	}
}

function sleep(ms) {
	return new Promise((res) => {
		setTimeout(res, ms);
	});
}
