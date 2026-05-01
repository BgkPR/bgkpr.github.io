// This replaces DotNet
console.log("Processing...");

const currentUrl = window.location.href;
const basePath = currentUrl.substring(0, currentUrl.lastIndexOf('/')) + '/';
console.log(`Base path: ${basePath}`);

const urlParams = new URLSearchParams(window.location.search);
const matchid = urlParams.get('matchid');
if (matchid) {
    console.log(`File parameter found: ${matchid}`);
}
const chatid = urlParams.get('chatid');
if (chatid) {
    console.log(`Chat parameter found: ${chatid}`);
}


var usersWhoChatted = new Set();
function setChatted() {
    fetch('masterChat.txt')
        .then(response => response.text())
        .then(allText => {
            var lines = allText.split('\n');
            // Sanitize.
            for (let i = 0; i < lines.length; i++) {
                const parts = lines[i].split('\t');
                if (parts.length >= 3) {
                    parts[2] = parts[2].replace(/"/g, '');
                    parts[2] = parts[2].replace(/\r/g, '');
                    lines[i] = parts.join('\t');
                }
            }

            for (let i = 0; i < lines.length; i++) {
                const parts = lines[i].split('\t');
                if (parts.length >= 3 && !usersWhoChatted.has(parts[2])) {
                    usersWhoChatted.add(parts[2]);
                }
            }
        });
}

// Reads masterChatDataH.txt and logs all chat messages for a specified match ID
function getMatchChatMessages(matchId) {
    console.log(`Fetching chat messages for Match ID: ${matchId}`);

    return fetch('masterChatDataH.txt')
        .then(response => response.text())
        .then(allText => {
            const blocks = allText.split('\r\n\r\n');
            var matchBlock = blocks.find(block => block.startsWith(matchId));
            var endIndex = matchBlock.indexOf('\n\n');
            if (endIndex !== -1) {
                matchBlock = matchBlock.substring(0, endIndex);
            }
            console.log(`End chat index for Match ID ${matchId}: ${endIndex}`);
            if (matchBlock) {
                const lines = matchBlock.split('\n');
                return lines.slice(1).map(line => {
                    const parts = line.split('\t');
                    return {
                        steamid: parts[0],
                        username: parts[1],
                        message: parts[2]
                    };
                });
            } else {
                console.log(`Match ID ${matchId} not found in masterChatData`);
                return [];
            }
        })
        .catch(error => {
            console.error('Error fetching masterChatDataH.txt:', error);
            return [];
        });


}


// Method to read chats and display messages for a specified chat id
function displayChatDetails(chatId) {
    const docroot = document.getElementsByClassName('docroot')[0];
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.remove();
    }
    fetch('masterChat.txt')
        .then(response => response.text())
        .then(allText => {
            var lines = allText.split('\n');
            // Sanitize.
            for (let i = 0; i < lines.length; i++) {
                const parts = lines[i].split('\t');
                if (parts.length >= 3) {
                    parts[2] = parts[2].replace(/"/g, '');
                    parts[2] = parts[2].replace(/\r/g, '');
                    parts[0] = parts[0].replace(/(^")|("$)/g, '');
                    parts[0] = parts[0].replace(/""/g, '"');
                    lines[i] = parts.join('\t');
                }
            }

            console.log(`Total lines in chats.txt: ${lines.length}`);
            console.log(`Filtering for Chat ID: ${chatId}`);

            const chatLines = lines.filter(line => line.split('\t')[2] === chatId);
            console.log(`Found ${chatLines.length} lines for Chat ID ${chatId}.`);
            if (chatLines.length > 0) {
                const titleElement = document.createElement('h1');
                titleElement.textContent = `Chat ID: ${chatId}`;
                titleElement.classList.add('title');
                docroot.appendChild(titleElement);
                chatLines.forEach(line => {
                    const parts = line.split('\t');
                    const username = parts[0];
                    const message = parts[1];
                    const messageElement = document.createElement('h1');
                    messageElement.textContent = `${username}: ${message}`;
                    messageElement.classList.add('chatMessage');
                    docroot.appendChild(messageElement);
                });
            } else {
                const h1 = document.createElement('h1');
                h1.textContent = `No records for ${chatId}`;
                h1.classList.add('h1Error');
                document.body.appendChild(h1);
            }
        });
}



// method to read matches and display users for a specified match id
function displayMatchDetails(matchId) {
    const docroot = document.getElementsByClassName('docroot')[0];
    // Remove search bar if it exists
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.remove();
    }
    // Add return to main page link
    docroot.appendChild(document.createElement('br'));
    const returnLink = document.createElement('a');
    returnLink.href = `${basePath}index.html`;
    returnLink.textContent = "Return to Main Page";
    docroot.appendChild(returnLink);

    setChatted();
    fetch('matches.txt')
        .then(response => response.text())
        .then(allText => {
            const blocks = allText.split('\r\n\r\n');
            const matchBlock = blocks.find(block => block.startsWith(matchId));
            if (matchBlock) {
                const lines = matchBlock.split('\n');
                console.log(`Match ID: ${lines[0]}`);
                const titleElement = document.createElement('h1');
                titleElement.textContent = `Match ID: ${matchId}`;
                titleElement.classList.add('title');
                docroot.appendChild(titleElement);



                for (var player = 1; player < lines.length; player++) {
                    console.log(`Player: ${lines[player]}`);
                    const matchId = lines[0];

                    const h1 = document.createElement('h2');
                    h1.textContent = `${lines[player]}`;
                    h1.classList.add('h2username');
                    // Link to player chats for this user.
                    const rawId = lines[player].split("\t")[0];

                    if (usersWhoChatted.has(rawId)) {
                        const anchor = document.createElement('a');
                        anchor.href = `${basePath}index.html?chatid=${rawId}`;
                        anchor.textContent = "User Chats (Non Match-Specific)";

                        const separator = document.createElement('span');
                        separator.textContent = " | ";
                        separator.style.margin = "0 5px";
                        h1.appendChild(separator);
                        h1.appendChild(anchor);
                    }

                    docroot.appendChild(h1);
                }
                const chatMessages = getMatchChatMessages(matchId);


                chatMessages.then(messages => {
                    if (messages.length > 0) {
                        const chatTitle = document.createElement('h1');
                        chatTitle.textContent = "Match-Specific Chat Messages";
                        chatTitle.classList.add('title');
                        docroot.appendChild(chatTitle);
                        messages.forEach(msg => {
                            const messageElement = document.createElement('h2');
                            messageElement.textContent = `${msg.username}: ${msg.message}`;
                            messageElement.classList.add('h2chatMessage');
                            docroot.appendChild(messageElement);
                        });
                    } else {
                        console.log(`No chat messages found for Match ID ${matchId}.`);
                    }
                });
            } else {
                console.log(`Match ID ${matchId} not found.`);
                const h1 = document.createElement('h1');
                h1.textContent = `Match ID ${matchId} not found.`;
                h1.classList.add('h1Error');
                document.body.appendChild(h1);
            }
        });
}


var userDict = {};
// Prefetch matches.txt to improve performance when navigating back to the main page
// Performance is already subpar.
fetch('matches.txt')
    .then(response => response.text())
    .then(allText => {
        // Stable dict of friendly search.
        const blocks = allText.split('\r\n\r\n');
        blocks.forEach(block => {
            const lines = block.split('\n');
            if (lines[0] == "") {
                console.log("EOF")
                return;
            }
            for (var player = 1; player < lines.length; player++) {
                const rawId = lines[player].split("\t")[0];
                const username = lines[player].split("\t")[1];
                // This allows for multiple matches to be associated with a single player.
                if (!userDict[rawId]) {
                    userDict[rawId] = `${lines[0]}:${username}`;
                    continue;
                }
                userDict[rawId] += `, ${lines[0]}:${username}`;
            }
        });
        console.log(`Prefetched ${Object.keys(userDict).length} unique player IDs.`);
        // Format: userDict[rawId] = "match1:username1, match2:username2, match3:username3"
        // Example usage: console.log(userDict['player123']); 
        console.log(userDict["[U:1:100031079]"])
    })
    .catch(error => {
        console.error('Error prefetching matches.txt:', error);
    });


function searchBarInput() {
    var docroot = document.getElementsByClassName('docroot')[0];

    if (!docroot) {
        console.error("Docroot element not found!");
        return;
    }
    const query = searchBar.value.toLowerCase().trim();
    const matchElements = document.getElementsByClassName('matchTextElement');
    Array.from(matchElements).forEach(element => {
        const text = element.textContent.toLowerCase();
        if (text.includes(query)) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    });
    // No matches.
    if (document.querySelectorAll('.matchTextElement:not([style*="display: none"])').length === 0) {
        console.log(`No matches found for "${query}". Searching by player ID...`);
        var queryUpper = query.toUpperCase();

        // Nonstandard input.
        if (/^\d+$/.test(query)) {
            queryUpper = `[U:1:${query}]`;
            console.log(`Assuming numeric query is a steamID. Converted to ${queryUpper}`);
        }
        else if (/^U:1:\d+$/.test(queryUpper)) {
            queryUpper = `[${queryUpper}]`;
            console.log(`Assuming query is a steamID missing brackets. Converted to ${queryUpper}`);
        }

        var userMatches = userDict[queryUpper];

        // Aliasing and partial username search.
        if (!userMatches && query.length >= 2) {
            console.log(`No matches found for player ID "${queryUpper}". Searching by username...`);
            for (const [rawId, matches] of Object.entries(userDict)) {
                const matchEntries = matches.split(', ');
                for (const matchEntry of matchEntries) {
                    const colonIndex = matchEntry.indexOf(':');
                    const matchId = matchEntry.substring(0, colonIndex);
                    const username = matchEntry.substring(colonIndex + 1);

                    if (username.toLowerCase().includes(query)) {
                        console.log(`Found username match: ${username} in match ID ${matchId} for player ID ${rawId}`);
                        if (!userMatches) {
                            userMatches = `${matchId}:${username}`;
                        } else {
                            userMatches += `, ${matchId}:${username}`;
                        }
                    }
                }
            }
        }

        console.log(`User matches for "${queryUpper}": ${userMatches}`);
        let tempElement = document.getElementById('tempSearchResult');
        if (!tempElement) {
            tempElement = document.createElement('div');
            tempElement.id = 'tempSearchResult';
            tempElement.classList.add('tempSearchResult');
            docroot.appendChild(tempElement);
        }
        if (userMatches) {
            const matches = userMatches.split(', ');
            tempElement.innerHTML = '';
            matches.forEach(match => {
                const [matchId, username] = match.split(':');
                const matchDiv = document.createElement('h1');
                if (queryUpper.startsWith("[U:1:") && queryUpper.endsWith("]")) {
                    matchDiv.textContent = `Match ID: ${matchId}, Steam ID: ${queryUpper}, Username: ${username}`;
                } else {
                    matchDiv.textContent = `Match ID: ${matchId}, Username: ${username}`;
                }
                matchDiv.classList.add('matchTextElement');
                matchDiv.style.width = '100%';


                const anchor = document.createElement('a');
                anchor.href = `${basePath}index.html?matchid=${matchId}`;
                anchor.textContent = matchDiv.textContent;
                matchDiv.textContent = '';
                matchDiv.appendChild(anchor);

                tempElement.appendChild(matchDiv);
            });
        } else {
            tempElement.textContent = `No matches found for query: ${queryUpper}`;
        }

    } else {
        const tempElement = document.getElementById('tempSearchResult');
        if (tempElement) {
            tempElement.remove();
        }
    }
}

// Wait
document.addEventListener('DOMContentLoaded', async () => {
    var docroot = document.getElementsByClassName('docroot')[0];

    if (!docroot) {
        console.error("Docroot element not found!");
        return;
    }

    if (matchid) {
        displayMatchDetails(matchid);
        return;
    }

    if (chatid) {
        displayChatDetails(chatid);
        return;
    }

    await fetch('matches.txt')
        .then(response => response.text())
        .then(allText => {
            const blocks = allText.split('\r\n\r\n');
            console.log(blocks.length)

            var x = 0
            blocks.forEach(block => {
                const lines = block.split('\n');
                if (lines[0] == "") {
                    console.log("EOF")
                    return;
                }

                x += 1;
                const h1 = document.createElement('h1');
                h1.textContent = `${lines[0]}`;
                h1.classList.add('matchTextElement');
                const anchor = document.createElement('a');
                anchor.href = `${basePath}index.html?matchid=${lines[0]}`;
                anchor.textContent = h1.textContent;
                h1.textContent = '';
                h1.appendChild(anchor);
                docroot.appendChild(h1);
            });
            console.log(`Parsed ${x} entries`)
        });

    // Cross referenced with raw input for posterity.
    const searchBar = document.getElementById('searchBar');
    if (!searchBar) {
        console.error("Search bar element not found!");
        return;
    }
    searchBar.addEventListener('input', () => {
        searchBarInput();
    });
    if (searchBar.value.trim() !== '') {
        searchBarInput();
    }
});
