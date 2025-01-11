import {FindAnimeTitleElement} from "./content.js";
const clickButton = document.getElementById("clickButton")
const searchBar = document.getElementById("searchBar")
const bookmarksContainer = document.getElementById("bookmarks-container"); 

function editDisplay(input){
    searchBar.value += input;
}

clickButton.onclick = async function(){
    const animeTitle = await fetchAnimeName();
    if (!isNaN(animeTitle)) {
        newBookMarkHandlerID(animeTitle);
    } else if (!animeTitle.includes("Not Valid")){
        newBookMarkHandler(animeTitle);
    } else {
        const info = document.getElementById("topInfo");
        info.innerHTML = "Use the search bar or click button on miruro.tv or MyAnimeList";
    }
}

searchBar.addEventListener("keydown", async (e) => {
    if (e.key == 'Enter') {
        const inputVal = e.target.value;
        newBookMarkHandler(inputVal);
    }
})
// FUNCTIONALITY METHODS

async function fetchAnimeName(){
    const tabString = await FindAnimeTitleElement();
    return tabString; 
}

async function newBookMarkHandlerID(searchQry) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${searchQry}`);
        const res = await response.json();
        const data = res.data;
        const newBookmark = {
            title: data.title,
            img: data.images.jpg.image_url,
            url: data.url,
            totalEpisodes: data.episodes,
            status: data.status,
            currentEpisode: 0,
        }
        chrome.storage.local.set({[newBookmark.title]: newBookmark});
        chrome.storage.local.get("bookmarks", (result) => {
            const keys = result.bookmarks || []
            if (!keys.includes(newBookmark.title)) {
                keys.push(newBookmark.title);
                chrome.storage.local.set({bookmarks: keys});
                generateBookmark(newBookmark);
            }
        })
    } catch(error) {
        editDisplay("Couldn't find valid anime in search")
    }
}

//converts the search query title into MAL data
async function newBookMarkHandler(searchQry){
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${searchQry}&limit=1`) 
        const res = await response.json();
        const data = res.data[0];
        // await bookmarkadds(data);
        const newBookmark = {
            title: data.title,
            img: data.images.jpg.image_url,
            url: data.url,
            totalEpisodes: data.episodes,
            status: data.status,
            currentEpisode: 0,
        }
        chrome.storage.local.set({[newBookmark.title]: newBookmark});
        chrome.storage.local.get("bookmarks", (result) => {
            const keys = result.bookmarks || []
            if (!keys.includes(newBookmark.title)) {
                keys.push(newBookmark.title);
                chrome.storage.local.set({bookmarks: keys});
                generateBookmark(newBookmark);
            }
        })
    } catch(error) {
        editDisplay("Couldn't find valid anime in search")
    }
}

// FUNCTIONS FOR CREATING BOOKMARKS

function generateBookmark(bookmark) {
    const newBookmarkElement = document.createElement("div");
    newBookmarkElement.id = bookmark.title;
    const bookmarkInfoDiv = document.createElement("div");
    const episodeData = document.createElement("div");
    newBookmarkElement.className="bookmark-div";
    bookmarkInfoDiv.className="bookmark-info";
    episodeData.className="episode-div";
    newBookmarkElement.innerHTML = `<img src="${bookmark.img}" class="booksmark-image" style="width:30%">`;
    const truncatedTitle = truncateText(bookmark.title, 22);
    bookmarkInfoDiv.innerHTML = `<h1 class="bookmark-title"><a href="${bookmark.url}" 
    target ="_blank" class="bookmark-title">${truncatedTitle}</a></h1>`;
    // create buttons
    const plus = document.createElement("button");
    plus.className="plus-button";
    plus.innerHTML = "+";
    plus.onclick = () => addEpisode(bookmark.title);
    const minus = document.createElement("button");
    minus.className="minus-button";
    minus.innerHTML="-";
    minus.onclick = () => subtractEpisode(bookmark.title);
    const del = document.createElement("button");
    del.className="delete-button";
    del.innerHTML= "Del";
    del.onclick = () => deleteEpisode(bookmark.title);
    //create episode counters
    const epC = document.createElement("input");
    epC.className="episode-counter";
    epC.type = "number";
    epC.min = "0"; 
    epC.max = `${bookmark.totalEpisodes}`;
    epC.id="watched-EPs-" + bookmark.title;
    epC.value=bookmark.currentEpisode;
    epC.addEventListener("submit", () =>{
        if (!epC.checkValidity) {
            if (epC.validity.rangeOverflow) {
                epC.valueAsNumber = epC.max;
            } else {
                epC.valueAsNumber = 0;
            }
        } else {
            chrome.storage.local.get(bookmark.title, (result) => {
                const bm = result[bookmark.title];
                bm.currentEpisode = episodeCount.valueAsNumber;
                chrome.storage.local.set({[bookmark.title]: bm})
            });
        }
    })
    const totalEp = document.createElement("input");
    totalEp.type = "number";
    totalEp.className="total-episodes";
    totalEp.id= "total-EPs-" + bookmark.totalEpisodes;
    totalEp.readOnly = true;
    totalEp.value = `${bookmark.totalEpisodes}`;
    const slash = document.createElement("span");
    slash.innerHTML= "/ ";
    episodeData.appendChild(minus);
    episodeData.appendChild(epC);
    episodeData.appendChild(slash);
    episodeData.appendChild(totalEp);
    episodeData.appendChild(totalEp);
    episodeData.appendChild(plus);
    episodeData.appendChild(del);
  
    //add airing status
    const AiringStatus = document.createElement("p");
    AiringStatus.innerHTML = `${bookmark.status}`;
    episodeData.appendChild(AiringStatus);
    AiringStatus.id = `status-${bookmark.title}`;
  
    bookmarkInfoDiv.appendChild(episodeData);
    newBookmarkElement.appendChild(bookmarkInfoDiv);
    bookmarksContainer.insertAdjacentElement("afterbegin", newBookmarkElement);
}

//event functions for buttons

function addEpisode(title) {
    const episodeCount=  document.getElementById("watched-EPs-" + title);
    const episodeINT = episodeCount.valueAsNumber;
    
    if (episodeCount.valueAsNumber < episodeCount.max){
        episodeCount.valueAsNumber = episodeINT + 1;
    } else if (episodeCount.valueAsNumber > episodeCount.max) {
        episodeCount.valueAsNumber = episodeCount.max;
    } else if (episodeCount.valueAsNumber < episodeCount.min) {
        episodeCount.valueAsNumber = 0;
    }
    chrome.storage.local.get(title, (result) => {
        const bookmark = result[title];
        bookmark.currentEpisode = episodeCount.valueAsNumber;
        chrome.storage.local.set({[title]: bookmark})
        });
}

function subtractEpisode(title) {
    const episodeCount = document.getElementById("watched-EPs-" + title);
    const episodeINT = episodeCount.valueAsNumber;
    if (episodeCount.valueAsNumber > episodeCount.min){
        episodeCount.valueAsNumber = episodeINT - 1;
    } else if (episodeCount.valueAsNumber > episodeCount.max) {
        episodeCount.valueAsNumber = episodeCount.max;
    } else if (episodeCount.valueAsNumber < episodeCount.min) {
        episodeCount.valueAsNumber = 0;
    }
    chrome.storage.local.get(title, (result) => {
        const bookmark = result[title];
        bookmark.currentEpisode = episodeCount.valueAsNumber;
        chrome.storage.local.set({[title]: bookmark})
    });
}

function deleteEpisode(title) {
    const deletionSubject = document.getElementById(title);
    chrome.storage.local.remove(title);
    chrome.storage.local.get("bookmarks", (result) => {
        const keys = result.bookmarks || [];
        const newKeys = keys.filter((key) => key != title);
        chrome.storage.local.set({bookmarks: newKeys});
    })
    deletionSubject.parentNode.removeChild(deletionSubject);
}

function truncateText(text, maxLength) {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }
    return text;
}

// FUNCTIONS FOR LOADING SAVED BOOKMARKS

document.addEventListener("DOMContentLoaded", async () => {
    chrome.storage.local.get("bookmarks", (result) => {
        const keys = result.bookmarks || [];
        // editDisplay(keys);
        keys.forEach((bookmarkTitle) => {
            // editDisplay(bookmarkTitle);
            chrome.storage.local.get(bookmarkTitle, (bookmarkResult) => {
                const bookmark = bookmarkResult[bookmarkTitle];
                generateBookmark(bookmark);
                // editDisplay(bookmark);
            })
        })
    })
})

//generate bookmark using json data
function bookmarkadds(data){
    const newBookmarkElement = document.createElement("div");
    const bookmarkInfoDiv = document.createElement("div");
    const episodeData = document.createElement("div");
    newBookmarkElement.className="bookmark-div";
    bookmarkInfoDiv.className="bookmark-info";
    episodeData.className="episode-div";
    newBookmarkElement.innerHTML = `<img src="${data.images.jpg.image_url}" class="booksmark-image" style="width:30%">`;
    const truncatedTitle = truncateText(data.title, 22);
    bookmarkInfoDiv.innerHTML = `<h1 class="bookmark-title"><a href="${data.url}">${truncatedTitle}</a></h1>`;
    // create buttons
    const plus = document.createElement("button");
    plus.className="plus-button";
    plus.innerHTML = "+";
    plus.onclick = () => addEpisode(data.title);
    const minus = document.createElement("button");
    minus.className="minus-button";
    minus.innerHTML="-";
    minus.onclick = () => subtractEpisode(data.title);
    const del = document.createElement("button");
    del.className="delete-button";
    del.innerHTML= "Del";
    //create episode counters
    const epC = document.createElement("input");
    epC.className="episode-counter";
    epC.type = "number";
    epC.min = "0"; 
    epC.max = `${data.episodes}`;
    epC.id="watched-EPs-" + data.title;
    epC.value= currentEpisode;
    epC.addEventListener("input", () =>{
        if (!epC.reportValidity) {
            if (epC.validity.rangeOverflow) {
                epC.valueAsNumber = data.episodes;
            } else {
                epC.valueAsNumber = 0;
            }
        }
    })
    const totalEp = document.createElement("input");
    totalEp.type = "number";
    totalEp.className="total-episodes";
    totalEp.id= "total-EPs-" + data.episodes;
    totalEp.readOnly = true;
    totalEp.value = `${data.episodes}`;
    const slash = document.createElement("span");
    slash.innerHTML= "/ ";
    episodeData.appendChild(plus);
    episodeData.appendChild(epC);
    episodeData.appendChild(slash);
    episodeData.appendChild(totalEp);
    episodeData.appendChild(totalEp);
    episodeData.appendChild(minus);
    episodeData.appendChild(del);

    //add airing status
    const AiringStatus = document.createElement("p");
    AiringStatus.innerHTML = `${data.status}`;
    episodeData.appendChild(AiringStatus);
    AiringStatus.id = `status-${data.title}`;

    bookmarkInfoDiv.appendChild(episodeData);
    newBookmarkElement.appendChild(bookmarkInfoDiv);
    bookmarksContainer.insertAdjacentElement("beforeend", newBookmarkElement);
}
