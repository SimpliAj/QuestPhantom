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

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
let allQuests = QuestsStore?.quests ? [...QuestsStore.quests.values()].filter(x => x.id !== "1412491570820812933" && x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() && supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y))) : []
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
	const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null)
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
				const appData = res.body[0]
				const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","")
				
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
	} else if(taskName === "PLAY_ACTIVITY") {
		const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id
		const streamKey = `call:${channelId}:1`
		
		let fn = async () => {
			logToFile("spoofing", `Completing quest ${questName}`, {questName})
			
			while(true) {
				const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}})
				const progress = res.body.progress.PLAY_ACTIVITY.value
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
