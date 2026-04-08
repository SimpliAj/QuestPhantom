delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
let RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api
if(!ApplicationStreamingStore) {
	ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.A;
	RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames)?.exports?.Ay;
	QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest)?.exports?.A;
	ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports?.A;
	GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel)?.exports?.Ay;
	FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue)?.exports?.h;
	api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get)?.exports?.Bo;
} else {
	RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames)?.exports?.ZP;
	QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z;
	ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent)?.exports?.Z;
	GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel)?.exports?.ZP;
	FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue)?.exports?.Z;
	api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get)?.exports?.tn;	
}

// Logger für CLI
function logToFile(type, message, data = {}) {
	const logEntry = {
		type,
		message,
		data,
		timestamp: new Date().toISOString()
	};
	console.log(JSON.stringify(logEntry));
}

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE", "ACHIEVEMENT_IN_ACTIVITY"]
let allQuests = QuestsStore?.quests ? [...QuestsStore?.quests.values()].filter(x => x.id !== "1412491570820812933" && x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() && supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y))) : []
let isApp = typeof DiscordNative !== "undefined"

if(!QuestsStore) {
	logToFile("error", "QuestsStore not found! Cannot proceed.", {})
} else if(!allQuests || allQuests.length === 0) {
	logToFile("info", "You don't have any uncompleted quests!")
} else {
	logToFile("info", `Found ${allQuests.length} active quest(s). Starting to process them sequentially...`, {totalQuests: allQuests.length})
	processQuestsSequentially(allQuests, 0)
}

async function processQuestsSequentially(quests, index) {
	if(index >= quests.length) {
		logToFile("info", "All quests completed! Starting to redeem rewards...")
		await redeemAllQuests(quests)
		logToFile("completed", "All quests completed and redeemed!")
		return
	}
	
	let quest = quests[index]
	logToFile("quest_start", `Processing: ${quest.config.messages.questName}`, {questIndex: index + 1, totalQuests: quests.length, questName: quest.config.messages.questName})
	
	// Process the current quest
	await processQuest(quest, quests, index)
}

async function processQuest(quest, allQuests, questIndex) {
	const pid = Math.floor(Math.random() * 30000) + 1000
	
	const applicationId = quest.config.application.id
	const applicationName = quest.config.application.name
	const questName = quest.config.messages.questName
	const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2
	const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE", "PLAY_ON_XBOX", "PLAY_ON_PLAYSTATION", "ACHIEVEMENT_IN_ACTIVITY"].find(x => taskConfig.tasks[x] != null)
	const secondsNeeded = taskConfig.tasks[taskName].target
	let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0

	if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
		const maxFuture = 10, speed = 7, interval = 1
		const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime()
		let completed = false
		let fn = async () => {			
			while(true) {
				const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture
				const diff = maxAllowed - secondsDone
				const timestamp = secondsDone + speed
				if(diff >= speed) {
					const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}})
					completed = res.body.completed_at != null
					secondsDone = Math.min(secondsNeeded, timestamp)
					logToFile("progress", `Quest "${questName}" progress: ${secondsDone}/${secondsNeeded}`, {questName, current: secondsDone, total: secondsNeeded, percentage: Math.round((secondsDone / secondsNeeded) * 100)})
				}
				
				if(timestamp >= secondsNeeded) {
					break
				}
				await new Promise(resolve => setTimeout(resolve, interval * 1000))
			}
			if(!completed) {
				await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}})
			}
			logToFile("quest_complete", "Quest completed!", {questName})
			processQuestsSequentially(allQuests, questIndex + 1)
		}
		fn()
		logToFile("spoofing", `Spoofing video for ${questName}.`, {questName})
	} else if(taskName === "PLAY_ON_DESKTOP") {
		if(!isApp) {
			logToFile("error", "This no longer works in browser for non-video quests. Use the discord desktop app to complete the quest!", {questName})
		} else {
			api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
				if(!res || !res.body || res.body.length === 0) {
					logToFile("error", "Failed to fetch application data from API", {applicationId})
					processQuestsSequentially(allQuests, questIndex + 1)
					return
				}
				const appData = res.body[0]
				logToFile("debug", "API Response appData structure", {appDataKeys: Object.keys(appData), appData})
				
				// Handle both old and new API structures
				let exeName
				if(appData.executables && appData.executables.length > 0) {
					const winExe = appData.executables.find(x => x.os === "win32")
					if(!winExe) {
						logToFile("error", "No Windows executable found for application", {applicationId})
						processQuestsSequentially(allQuests, questIndex + 1)
						return
					}
					exeName = winExe.name.replace(">","")
				} else {
					// Fallback: Create generic executable name from app name
					exeName = appData.name.toLowerCase().replace(/\s+/g, "_") + ".exe"
					logToFile("info", "Using fallback executable name (executables not in API response)", {generatedExeName: exeName})
				}
				
				
				const fakeGame = {
					cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
					exeName,
					exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
					hidden: false,
					isLauncher: false,
					id: applicationId,
					name: appData.name,
					pid: pid,
					pidPath: [pid],
					processName: appData.name,
					start: Date.now(),
				}
				const realGames = RunningGameStore.getRunningGames()
				const fakeGames = [fakeGame]
				const realGetRunningGames = RunningGameStore.getRunningGames
				const realGetGameForPID = RunningGameStore.getGameForPID
				RunningGameStore.getRunningGames = () => fakeGames
				RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid)
				FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames})
				
				let fn = data => {
					let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value)
					logToFile("progress", `Quest "${questName}" progress: ${progress}/${secondsNeeded}`, {questName, current: progress, total: secondsNeeded, percentage: Math.round((progress / secondsNeeded) * 100)})
					
					if(progress >= secondsNeeded) {
						logToFile("quest_complete", "Quest completed!", {questName})
						
						RunningGameStore.getRunningGames = realGetRunningGames
						RunningGameStore.getGameForPID = realGetGameForPID
						FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []})
						FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
						
						processQuestsSequentially(allQuests, questIndex + 1)
					}
				}
				FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
				
				logToFile("spoofing", `Spoofed your game to ${applicationName}. Wait for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`, {questName, applicationName, minutesLeft: Math.ceil((secondsNeeded - secondsDone) / 60)})
			}).catch(err => {
				logToFile("error", `Failed to get application data: ${err.message}`, {error: err.message, applicationId})
				processQuestsSequentially(allQuests, questIndex + 1)
			})
		}
	} else if(taskName === "STREAM_ON_DESKTOP") {
		if(!isApp) {
			logToFile("error", "This no longer works in browser for non-video quests. Use the discord desktop app to complete the quest!", {questName})
		} else {
			let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata
			ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
				id: applicationId,
				pid,
				sourceName: null
			})
			
			let fn = data => {
				let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value)
				logToFile("progress", `Quest "${questName}" progress: ${progress}/${secondsNeeded}`, {questName, current: progress, total: secondsNeeded, percentage: Math.round((progress / secondsNeeded) * 100)})
				
				if(progress >= secondsNeeded) {
					logToFile("quest_complete", "Quest completed!", {questName})
					
					ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc
					FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
					
					processQuestsSequentially(allQuests, questIndex + 1)
				}
			}
			FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
			
			logToFile("spoofing", `Spoofed your stream to ${applicationName}. Stream any window in vc for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`, {questName, applicationName, minutesLeft: Math.ceil((secondsNeeded - secondsDone) / 60)})
			logToFile("info", "Remember that you need at least 1 other person to be in the vc!")
		}
	} else if(taskName === "PLAY_ACTIVITY" || taskName === "PLAY_ON_XBOX" || taskName === "PLAY_ON_PLAYSTATION") {
		const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id
		const streamKey = `call:${channelId}:1`

		let fn = async () => {
			logToFile("spoofing", `Completing quest ${questName} (${taskName})`, {questName, taskName})

			while(true) {
				const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}})
				const progressData = res.body.progress
				const progress = (progressData.PLAY_ACTIVITY ?? progressData.PLAY_ON_XBOX ?? progressData.PLAY_ON_PLAYSTATION)?.value ?? 0
				logToFile("progress", `Quest "${questName}" progress: ${progress}/${secondsNeeded}`, {questName, current: progress, total: secondsNeeded, percentage: Math.round((progress / secondsNeeded) * 100)})

				await new Promise(resolve => setTimeout(resolve, 20 * 1000))

				if(progress >= secondsNeeded) {
					await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}})
					break
				}
			}

			logToFile("quest_complete", "Quest completed!", {questName})
			processQuestsSequentially(allQuests, questIndex + 1)
		}
		fn()
	} else if(taskName === "ACHIEVEMENT_IN_ACTIVITY") {
		if(!isApp) {
			logToFile("error", "ACHIEVEMENT_IN_ACTIVITY requires the Discord desktop app!", {questName})
			processQuestsSequentially(allQuests, questIndex + 1)
		} else {
			const achievementConfig = taskConfig.tasks.ACHIEVEMENT_IN_ACTIVITY
			const appId = achievementConfig?.applications?.[0]?.id

			if(!appId) {
				logToFile("error", "Could not find application ID for achievement quest", {questName})
				processQuestsSequentially(allQuests, questIndex + 1)
				return
			}

			try {
				// Step 1: OAuth2 authorize via Discord API
				const authRes = await api.post({
					url: `/oauth2/authorize?client_id=${appId}&response_type=code&scope=identify%20applications.entitlements&state=`,
					body: { authorize: true }
				})

				const location = authRes?.body?.location
				if(!location) {
					logToFile("error", "No redirect location in OAuth2 response", {questName})
					processQuestsSequentially(allQuests, questIndex + 1)
					return
				}

				const authCode = new URL(location).searchParams.get("code")
				if(!authCode) {
					logToFile("error", "No auth code in redirect URL", {questName})
					processQuestsSequentially(allQuests, questIndex + 1)
					return
				}

				logToFile("info", `Got auth code for ${questName}, exchanging for token...`, {questName})

				// Step 2: Exchange code for activity server token
				const tokenRes = await fetch(`https://${appId}.discordsays.com/.proxy/acf/authorize`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ code: authCode }),
					credentials: "include"
				})
				const tokenData = await tokenRes.json()
				const token = tokenData.token

				if(!token) {
					logToFile("error", "Failed to get token from activity server", {questName})
					processQuestsSequentially(allQuests, questIndex + 1)
					return
				}

				logToFile("spoofing", `Submitting achievement progress for ${questName}...`, {questName})

				// Step 3: Submit full progress to activity server
				const progressRes = await fetch(`https://${appId}.discordsays.com/.proxy/acf/quest/progress`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-auth-token": token
					},
					body: JSON.stringify({ progress: secondsNeeded }),
					credentials: "include"
				})

				if(progressRes.ok) {
					logToFile("quest_complete", "Achievement quest completed!", {questName})
				} else {
					logToFile("error", `Failed to submit progress: ${progressRes.status}`, {questName})
				}
			} catch(err) {
				logToFile("error", `Error completing achievement quest: ${err.message}`, {questName, error: err.message})
			}

			processQuestsSequentially(allQuests, questIndex + 1)
		}
	}
}

async function redeemAllQuests(quests) {
	for(let quest of quests) {
		try {
			const questName = quest.config.messages.questName
			logToFile("redeem_start", `Redeeming quest: ${questName}`, {questName})
			
			const res = await api.post({url: `/quests/${quest.id}/claim`})
			
			if(res.body) {
				logToFile("redeem_success", `Successfully redeemed: ${questName}`, {questName})
			} else {
				logToFile("redeem_error", `Failed to redeem: ${questName}`, {questName})
			}
		} catch(error) {
			logToFile("redeem_error", `Error redeeming quest: ${error.message}`, {error: error.message})
		}
	}
}
