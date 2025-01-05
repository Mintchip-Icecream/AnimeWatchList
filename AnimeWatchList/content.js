function getActiveTabURL() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            if (tabs.length > 0) {
                resolve(tabs[0]);  
            } else {
                reject("No active tab found");
            }
        });
    });
}

export async function FindAnimeTitleElement() {
    try {
        const activeTab = await getActiveTabURL(); 
        if (activeTab.url.includes("miruro.tv/watch?")) {
            const result = await new Promise((resolve, reject) => {
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    func: () => {
                        const titleElement = document.getElementsByClassName('anime-title-romaji')[0];
                        return titleElement ? titleElement.innerHTML : "Not Valid";
                    }
                }, (results) => {
                    if (results && results[0]) {
                        resolve(results[0].result); 
                    } else {
                        resolve("Not Valid, 1"); 
                    }
                });
            });
            return result;
        } else if (activeTab.url.includes("myanimelist.net/anime/")){
                const uniqueURL = activeTab.url.split("anime/")[1];
                const animeID = uniqueURL.split("/")[0];
                return animeID;
        } else{
            return "Not Valid, Error";  
        }
    } catch (error) {
        console.error("Error in FindAnimeTitleElement:", error);
        return "Not Valid, Error";  
    }
}

