const users = require("./query.json");
const puppeteer = require("puppeteer");

/**@type {{page:puppeteer.Page,browser:puppeteer.Browser,user:{id: string,totalCoins:number,balanceCoins: number,level: number,availableTaps: number,lastSyncUpdate: number,exchangeId: string,boosts: {},upgrades:{},tasks: {},airdropTasks: {},referralsCount: number,maxTaps: number,earnPerTap: number,earnPassivePerSec: number,earnPassivePerHour: number,lastPassiveEarn: number,tapsRecoverPerSec: number,referral: {},balanceTickets: number,claimedCipherAt: string,claimedUpgradeComboAt: string}}[]} */
const clients = {};

(async () => {
	for (let user of users) {
		const browser = await puppeteer.launch({ headless: false, devtools: true });
		const page = (await browser.pages())[0];
		clients[user.name] = { browser, page };
		await page.goto("https://hamsterkombat.io/clicker/");

		await page.evaluate(async (query) => {
			const data = {
				tgWebAppData: query,
				tgWebAppVersion: "7.6",
				tgWebAppPlatform: "android",
				tgWebAppThemeParams: {
					bg_color: "#212d3b",
					section_bg_color: "#1d2733",
					secondary_bg_color: "#151e27",
					text_color: "#ffffff",
					hint_color: "#7d8b99",
					link_color: "#5eabe1",
					button_color: "#50a8eb",
					button_text_color: "#ffffff",
					header_bg_color: "#242d39",
					accent_text_color: "#64b5ef",
					section_header_text_color: "#79c4fc",
					subtitle_text_color: "#7b8790",
					destructive_text_color: "#ee686f",
					section_separator_color: "#0d1218",
				},
			};
			sessionStorage.setItem("__telegram__initParams", JSON.stringify(data));
		}, user.query);

		await page.setExtraHTTPHeaders({
			Origin: "https://hamsterkombat.io",
			Referer: "https://hamsterkombat.io/",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
			"Accept-Encoding": "gzip, deflate, br, zstd",
			"Sec-Fetch-Dest": "empty",
			"Sec-Fetch-Mode": "cors",
			"Sec-Fetch-Site": "same-site",
			"X-Requested-With": "org.telegram.messenger",
			"sec-Ch-Ua-Platform": '"Android"',
			"sec-ch-ua-mobile": "?1",
			"Sec-Ch-Ua": '"Android WebView";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
			"User-Agent":
				"Mozilla/5.0 (Linux; Android 11; SM-A105F Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.134 Mobile Safari/537.36",
		});
		await page.reload();

		page.on("response", async (event) => {
			const url = event.url();
			if (url.includes("https://api.hamsterkombat.io")) {
				try {
					const data = await event.json();
					console.log(url);
					if (url.includes("sync")) {
						clients[user.name].user = data.clickerUser;
					}
					if (url.includes("config")) {
						clients[user.name].game = data;
					}
				} catch {}
			}
		});
	}
	setTimeout(start, 5000);
})();

function start() {
	for (let name in clients) {
		const client = clients[name];
		console.log(client);
	}
}

function tick() {}
