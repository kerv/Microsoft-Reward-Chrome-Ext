class DailyQuest {
    constructor(progress, max) {
        this.progress = progress;
        this.max = max;
    }

    get isCompleted() {
        return this.progress == this.max;
    }

    get isValid() {
        return this.max > 0;
    }

    get isValidAndCompleted() {
        return this.isValid && this.isCompleted;
    }

    get pointsToGet() {
        return this.max - this.progress;
    }
}

class DailySearchQuest extends DailyQuest {
    get pointPerSearch() {
        return 3;
    }

    get searchPerformedCount() {
        return this.progress / this.pointPerSearch;
    }

    get searchNeededCount() {
        return this.max / this.pointPerSearch - this.searchPerformedCount;
    }
}

class CardUrls {
    constructor(quiz, urlReward, urlRewardUrls) {
        this.quiz = quiz;
        this.urlReward = urlReward;
        this.urlRewardUrls = urlRewardUrls;
    }
}
