'use strict';

function onExtensionLoad() {
    setBadge(new GreyBadge());
    loadSavedSettings();
    getDeveloperSettings();
    setDelayedInitialisation(5000);
}

function loadSavedSettings() {
    chrome.storage.sync.get({
        compatibilityMode: false,
        AutoSolve: false
    }, function (options) {
        _compatibilityMode = options.compatibilityMode;
        _autosolve = options.AutoSolve
    });
}

async function getDeveloperSettings() {
    const devJson = chrome.runtime.getURL('developer.json');
    const fetchProm = await fetch(devJson, {method: 'GET'}).then((response) => {
        return response.json();
    }).then((json) => {
        developer = json;
        console.log('Developer mode enabled.');
        console.log(developer);
    }).catch((ex) => {
        if (ex.name == 'TypeError') {
            return;
        }
        throw ex;
    });
}

// -----------------------------
// Work
// -----------------------------
function setDelayedInitialisation(ms) {
    setTimeout(
        function () {
            initialize();
        },
        ms,
    );
}

function initialize() {
    doBackgroundWork();

    // check every 120 minutes for possible new promotion
    setInterval(
        function () {
            doBackgroundWork();
        },
        WORKER_ACTIVATION_INTERVAL,
    );
}

async function doBackgroundWork() {
    if (searchQuest.jobStatus == STATUS_BUSY || userDailyStatus.jobStatus == STATUS_BUSY) {
        return;
    }

    await waitTillOnline();

    setBadge(new BusyBadge());

    checkNewDay();
    await checkDailyRewardStatus();

    if (isCurrentBadge('busy')) {
        setBadge(new DoneBadge());
    }
}

async function waitTillOnline() {
    while (!navigator.onLine) {
        await setTimeoutAsync(WAIT_FOR_ONLINE_TIMEOUT);
    }
}

async function setTimeoutAsync(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkDailyRewardStatus() {
    // update status
    let result;
    try {
        result = await userDailyStatus.update();
    } catch (ex) {
        handleException(ex);
    }
    if (!result || !userDailyStatus.summary.isValid) {
        setBadge(new ErrorBadge());
        return;
    }

    await doSearchQuests();

    checkQuizAndDaily();
}

async function doSearchQuests() {
    if (userDailyStatus.summary.isCompleted) {
        return;
    }

    if (!userDailyStatus.pcSearchStatus.isCompleted || !userDailyStatus.mbSearchStatus.isCompleted) {
        try {
            await searchQuest.doWork(userDailyStatus);
        } catch (ex) {
            handleException(ex);
        }
    }
}

const WORKER_ACTIVATION_INTERVAL = 7200000; // Interval at which automatic background works are carried out, in ms.
const WAIT_FOR_ONLINE_TIMEOUT = 60000;

const googleTrend = new GoogleTrend();
const userDailyStatus = new DailyRewardStatus();
const searchQuest = new SearchQuest(googleTrend);
let developer = false;
let userAgents;
let _compatibilityMode;
let _autosolve;
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {

    }
    if (details.reason == 'update') {

    }
});

chrome.runtime.onMessage.addListener(function (request) {
    if (request.action == 'checkStatus') {
        doBackgroundWork();
    }
    if (request.action == 'updateOptions') {
        _compatibilityMode = request.content.compatibilityMode;
        _autosolve = request.content.AutoSolve;
        return;
    }
    if (request.action == 'copyDebugInfo') {
        getDetailInfo();
    }
});

// Listen for messages from the content script

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
}



chrome.tabs.onUpdated.addListener(async function(tabId,changeInfo,tab){
    let url = tab.url;
    if (url.includes("https://www.bing.com/search?q=") && changeInfo.status == 'complete'){ //make sure the page has finished loading
        // execute code once
        if(_autosolve){// if autosolve is enabled
            console.log("once");
            wait(3000); // wait for page load or refresh
            try{ // sometimes it gives error bc page is not loaded
                chrome.tabs.executeScript(tabId,{
                    file: 'solveContent.js'
                });
            }
            catch{
                console.log("error")
            }
                
        }
    }
});

onExtensionLoad();
