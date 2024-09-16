import axios from "axios";

export class Hamster {
	axios;
	game = {};
	user = {};
	TGUser = {};

	async post(url, data = {}) {
		try {
			const { data: responseData } = await this.axios.post(url, data);

			const updateFields = [
				{ key: "telegramUser", target: "TGUser" },
				{ key: "clickerUser", target: "user" },
				{ key: "upgradesForBuy", target: "game.upgrades" },
				{ key: "clickerConfig", target: "game.clickerConfig" },
				{ key: "dailyCipher", target: "game.dailyCipher" },
				{ key: "feature", target: "game.feature" },
				{ key: "sections", target: "game.sections" },
				{ key: "dailyCombo", target: "game.dailyCombo" },
				{ key: "tasks", target: "game.tasks" },
			];

			updateFields.forEach(({ key, target }) => {
				if (responseData[key]) {
					if (target.includes(".")) {
						const [obj, prop] = target.split(".");
						if (!this[obj] || typeof this[obj] !== 'object') {
							this[obj] = {};
						}
						this[obj][prop] = responseData[key];
					} else {
						this[target] = responseData[key];
					}
				}
			});
		} catch (e) {
			console.error("Error in post request:", e.response?.data?.error_message || e.code || e, "URL:", url);
		}
	}

	async update() {
		const endpoints = ["./sync", "./config", "./upgrades-for-buy", "./list-tasks", "../auth/me-telegram"];
		await Promise.all(endpoints.map((endpoint) => this.post(endpoint)));

		const formatNumber = (num) => parseInt(num).toLocaleString();
		const avgUpgradePrice = formatNumber(this.game.upgrades.reduce((sum, v) => sum + v.price, 0) / this.game.upgrades.length);

		console.log(
			"-".repeat(10)+"\n",
			`Name: ${this.TGUser.firstName}\n`,
			`Coins: ${formatNumber(this.user.balanceCoins)}/${avgUpgradePrice}\n`,
			`EPH: ${formatNumber(this.user.earnPassivePerHour)}\n`,
			`EPS: ${this.user.earnPassivePerSec}\n`,
			`Taps: ${this.user.availableTaps}/${this.user.maxTaps} - ${this.user.tapsRecoverPerSec}TPS+\n`,
		);
	}

	GetCardToBuy() {
		return this.game.upgrades
			.filter((v) => v.isAvailable && v.price < this.user.balanceCoins && v.profitPerHourDelta > 0 && !v.isExpired && !v.cooldownSeconds && v.condition?._type !== 'SubscribeTelegramChannel')
			.sort((a, b) => a.price / a.profitPerHourDelta - b.price / b.profitPerHourDelta)[0];
	}

	async tick() {
		await this.update();

		if (!this.game.dailyCipher.isClaimed) {
			console.log(`${this.TGUser.firstName}: claiming cipher`);
			const cipher = atob(`${this.game.dailyCipher.cipher.slice(0, 3)}${this.game.dailyCipher.cipher.slice(4)}`);
			await this.post("./claim-daily-cipher", { cipher }).catch(() => {});
		}

		for (const task of this.game.tasks) {
			if (!task.isCompleted && task.id !== "invite_friends") {
				const endpoint = task.id === "select_exchange" ? "./select-exchange" : "./check-task";
				const payload = task.id === "select_exchange" ? { exchangeId: "bingx" } : { taskId: task.id };
				await this.post(endpoint, payload);
				console.log(`${this.TGUser.firstName}: task ${task.id} completed`);
			}
		}

		await this.post("./tap", {
			count: this.user.availableTaps,
			availableTaps: 0,
			timestamp: Math.floor(Date.now() / 1000),
		});

		const avgUpgradePrice = this.game.upgrades.reduce((sum, v) => sum + v.price, 0) / this.game.upgrades.length;
		if (this.user.balanceCoins > avgUpgradePrice) {
			let cardToBuy;
			while ((cardToBuy = this.GetCardToBuy())) {
				console.log(`${this.TGUser.firstName}: buying card ${cardToBuy.name}`);
				await this.post("./buy-upgrade", { timestamp: Math.floor(Date.now() / 1000), upgradeId: cardToBuy.id });
			}
		}

		await this.update();

		const sleepTime = Math.floor((this.user.maxTaps - this.user.availableTaps) / this.user.tapsRecoverPerSec / 4);
		console.log(`Waiting for ${sleepTime} seconds`);
		await new Promise((resolve) => setTimeout(resolve, sleepTime * 1000));
		this.tick();
	}

	constructor(TOKEN) {
		this.axios = axios.create({
			baseURL: "https://api.hamsterkombatgame.io/clicker/",
			headers: { Authorization: TOKEN },
		});
		this.tick();
	}
}
