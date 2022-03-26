class SearchQuest {
    constructor(googleTrend) {
        this._googleTrend_ = googleTrend;
        this._searchIntervalMS = 2000;
        this.reset();
    }

    reset() {
        this._status_ = null;
        this._pcSearchWordIdx_ = 0;
        this._mbSearchWordIdx_ = 0;
        this._currentSearchCount_ = 0;
        this._currentSearchType_ = null;
        this._jobStatus_ = STATUS_NONE;
    }

    get jobStatus() {
        return this._jobStatus_;
    }

    async doWork(status) {
        console.assert(status != null);

        this._status_ = status;
        this._jobStatus_ = STATUS_BUSY;
        try {
            await getStableUA();
            await this._googleTrend_.getGoogleTrendWords();
            await this._doWorkLoop();
        } catch (ex) {
            this._jobStatus_ = STATUS_ERROR;
            if (ex instanceof UserAgentInvalidException) {
                notifyUpdatedUAOutdated();
            }
            throw ex;
        }
    }

    async _doWorkLoop() {
        while (true) {
            if (this._status_.isSearchCompleted) {
                return;
            }

            if (this._status_.jobStatus == STATUS_ERROR || !this._status_.summary.isValid) {
                this._jobStatus_ = STATUS_ERROR;
                return;
            }

            await this._startSearchQuests();

            const pcSearchProgBefore = this._status_.pcSearchStatus.progress;
            const mbSearchProgBefore = this._status_.mbSearchStatus.progress;
            await this._status_.update();
            const flag = (!this._status_.pcSearchStatus.isValidAndCompleted && (pcSearchProgBefore == this._status_.pcSearchStatus.progress)) + 2 * (!this._status_.mbSearchStatus.isValidAndCompleted && (mbSearchProgBefore == this._status_.mbSearchStatus.progress));
            await this._checkUA(flag);
        }
    }

    async _startSearchQuests() {
        await this._doPcSearch();
        await this._doMbSearch();
        this._quitSearchCleanUp();
    }

    async _doPcSearch() {
        this._initiateSearch();
        if (this._currentSearchType_ != SEARCH_TYPE_PC_SEARCH) {
            this._preparePCSearch();
        }

        await this._requestBingSearch();
    }

    async _doMbSearch() {
        this._initiateSearch();
        if (this._currentSearchType_ != SEARCH_TYPE_MB_SEARCH) {
            this._prepareMbSearch();
        }

        await this._requestBingSearch();
    }

    _initiateSearch() {
        this._currentSearchCount_ = 0;
    }

    _preparePCSearch() {
        this._currentSearchType_ = SEARCH_TYPE_PC_SEARCH;
        removeUA();
        setMsEdgeUA();
    }

    _prepareMbSearch() {
        this._currentSearchType_ = SEARCH_TYPE_MB_SEARCH;
        removeUA();
        setMobileUA();
    }

    _quitSearchCleanUp() {
        if (this._jobStatus_ == STATUS_BUSY) {
            this._jobStatus_ = STATUS_DONE;
        }
        this._currentSearchType_ = null;
        removeUA();
    }

    async _requestBingSearch() {
        if (this._isCurrentSearchCompleted()) {
            return;
        }
        let response;
        try {
            response = await fetch(this._getBingSearchUrl());
        } catch (ex) {
            throw new FetchFailedException('Search', ex);
        }

        if (response.status != 200) {
            throw new FetchResponseAnomalyException('Search');
        }

        this._currentSearchCount_++;
        await sleep(this._searchIntervalMS);

        await this._requestBingSearch();
    }

    _getBingSearchUrl() {
        const word = this._currentSearchType_ == SEARCH_TYPE_PC_SEARCH ?
            this._googleTrend_.nextPCWord :
            this._googleTrend_.nextMBWord;

        return `https://www.bing.com/search?q=${word}`;
    }

    _isCurrentSearchCompleted() {
        return this._currentSearchType_ == SEARCH_TYPE_PC_SEARCH ?
            this._currentSearchCount_ >= this._status_.pcSearchStatus.searchNeededCount :
            this._currentSearchCount_ >= this._status_.mbSearchStatus.searchNeededCount;
    }

    async _checkUA(flag) {
        if (flag == 3) {
            if (userAgents.pcSource == 'updated' && userAgents.mbSource == 'updated') {
                throw new UserAgentInvalidException('Cannot find working UAs for pc and mobile.');
            }
            await getUpdatedUA('both');
        } else if (flag == 1) {
            if (userAgents.pcSource == 'updated') {
                throw new UserAgentInvalidException('Cannot find a working UA for pc.');
            }
            await getUpdatedUA('pc');
        } else if (flag == 2) {
            if (userAgents.mbSource == 'updated') {
                throw new UserAgentInvalidException('Cannot find a working UA for mobile.');
            }
            await getUpdatedUA('mb');
        }
        if (flag > 0) {
            notifyStableUAOutdated(flag);
        }
    }
}

function removeUA() {
    // remove user-agent
    try {
        chrome.webRequest.onBeforeSendHeaders.removeListener(toMobileUA);
    } catch (ex) { }
    try {
        chrome.webRequest.onBeforeSendHeaders.removeListener(toMsEdgeUA);
    } catch (ex) { }
}

function setMsEdgeUA() {
    chrome.webRequest.onBeforeSendHeaders.addListener(toMsEdgeUA, {
        urls: ['https://www.bing.com/search?q=*'],
    }, ['blocking', 'requestHeaders']);
}

function toMsEdgeUA(details) {
    for (const i in details.requestHeaders) {
        if (details.requestHeaders[i].name === 'User-Agent') {
            details.requestHeaders[i].value = userAgents.pc;
            break;
        }
    }
    return {
        requestHeaders: details.requestHeaders,
    };
}

function setMobileUA() {
    chrome.webRequest.onBeforeSendHeaders.addListener(toMobileUA, {
        urls: ['https://www.bing.com/search?q=*'],
    }, ['blocking', 'requestHeaders']);
}

function toMobileUA(details) {
    for (const i in details.requestHeaders) {
        if (details.requestHeaders[i].name === 'User-Agent') {
            details.requestHeaders[i].value = userAgents.mb;
            break;
        }
    }
    return {
        requestHeaders: details.requestHeaders,
    };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function notifyStableUAOutdated(flag) {
    if (developer && developer.notification_ua_stable_outdated) {
        chrome.notifications.clear('stable_ua_outdated');
        chrome.notifications.create('stable_ua_outdated', {
            type: 'basic',
            iconUrl: 'img/warn@8x.png',
            title: 'Developer notification',
            message: 'Stable UA is outdated! Flag: ' + flag,
            priority: 2,
        });
    }
}

function notifyUpdatedUAOutdated() {
    if (developer && developer.notification_ua_updated_outdated) {
        chrome.notifications.clear('updated_ua_outdated');
        chrome.notifications.create('updated_ua_outdated', {
            type: 'basic',
            iconUrl: 'img/err@8x.png',
            title: 'Developer notification',
            message: 'Critical!! Updated UA is outdated!',
            priority: 2,
        });
    }
}

const SEARCH_TYPE_PC_SEARCH = 0;
const SEARCH_TYPE_MB_SEARCH = 1;
const STATUS_NONE = 0;
const STATUS_BUSY = 1;
const STATUS_DONE = 20;
const STATUS_WARNING = 30;
const STATUS_ERROR = 3;
