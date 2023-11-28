# Microsoft Rewards Bot

A Chrome extension for Microsoft Rewards, which automatically clears PC, mobile and Edge search quests and displays daily point countdown.

This extension will also complete quizzes and promotional links (most of the time). just be sure to emable them in the extension options.

**This is a bot!**

Use at your own risk. I do not take responsibility for any consequence caused by this extension.

# Install from GitHub

1. Head to [Release](https://github.com/kerv/Microsoft-Reward-Chrome-Ext/releases) and download the latest Source code (zip).
2. Unzip the downloaded file to somewhere you want to keep it.
3. Open Chrome.
4. Go to chrome://extensions/ and enable `Developer mode`.
5. Select `Load unpacked` and select the `src` folder.
6. Enable the extension.


# Install from Chrome web store

Unfortunately, the extension could not make its way to become visible on web store due to ... well ... obvious reasons.

# Use

1. Log into [Microsoft Rewards](https://account.microsoft.com/rewards) and [Bing](https://www.bing.com/).
2. Enjoy.

*Note: You may need to repeat step 1 every time you restart Chrome.*

# Functionality

### Background Work

The extension checks your daily Microsoft Rewards progress every two hours and clears any incomplete search quests. When you have any available quiz/link quests yet to complete, a yellow badge will show with a number indicating the amount of points they worth.

### Action Button

1. A button to force check reward progress.
2. A link to Microsoft Rewards.
3. Options:
   1. Compatibility Mode. Toggle to enable/disable a different way of calculating point countdown. Try this if you have any issues with the current point countdown method.
   2. Copy Debug Info. This will place a bunch of information in your clipboard. The information is not useful for end users.

### Action Button Badge

The colour of the badge changes depending on your daily reward progress or the status of the extension:

![greyLogo](src/img/grey@1x.png?raw=true) - Just hang on a second. The extension will start to work soon.

![blueLogo](src/img/busy@1x.png?raw=true) - Working hard on doing those search quests for ya!

![greenLogo](src/img/done@1x.png?raw=true) - Congratulations! You have completed all quests for today.

![yellowLogo](src/img/warn@1x.png?raw=true) - Attention! You still have some points to earn through quests.

![redLogo](src/img/err@1x.png?raw=true) - Opps... an error occurred - Check out [Troubleshooting](TROUBLESHOOTING.md).
