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
async function setChatted() {
    return fetch('masterChat.txt')
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
            return 1;
        });
}

// Reads masterChatDataH.txt and logs all chat messages for a specified match ID
function getMatchChatMessages(matchId) {
    console.log(`Fetching chat messages for Match ID: ${matchId}`);
    return fetch('masterChatDataH.txt')
        .then(response => response.text())
        .then(allText => {
            const blocks = allText.split(/\r?\n\r?\n/);
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
    const docroot = document.getElementById('docroot');
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
                // use createTableTR to maintain consistent styling.

                chatLines.forEach(line => {
                    const parts = line.split('\t');
                    const username = parts[0];
                    const message = parts[1];
                    var textContent = `${username} : ${message}`;
                    // Edit style for chat messages.
                    
                    var created = createTableTR(textContent, '', 'matchTextElement', '');
                    docroot.appendChild(created);
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
async function displayMatchDetails(matchId) {
    // Get docroot by id name
    const docroot = document.getElementById('docroot');
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

    await setChatted();
    fetch('matches.txt')
        .then(response => response.text())
        .then(allText => {
            const blocks = allText.split(/\r?\n\r?\n/);
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
        const blocks = allText.split(/\r?\n\r?\n/);
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
    var docroot = document.getElementById('docroot');

    if (!docroot) {
        console.error("Docroot element not found!");
        return;
    }
    const query = searchBar.value.toLowerCase().trim();
    const matchElements = document.getElementsByClassName('matchTextElement');
    Array.from(matchElements).forEach(element => {
        const text = element.textContent.toLowerCase();
        if (text.includes(query)) {
            element.parentElement.style.display = 'flex';
        } else {
            element.parentElement.style.display = 'none';
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
            tempElement = document.createElement('table');
            tempElement.id = 'tempSearchResult';
            tempElement.classList.add('results-wrapper-search');
            tempElement.style.marginTop = '20px';
            document.body.appendChild(tempElement);
        }
        if (userMatches) {
            const matches = userMatches.split(', ');
            tempElement.innerHTML = '';
            matches.forEach(match => {
                const [matchId, username] = match.split(':');
                var textContent = `Match ID: ${matchId}, Username: ${username}`;
                if (queryUpper.startsWith("[U:1:") && queryUpper.endsWith("]")) {
                    textContent = `Match ID: ${matchId}, Steam ID: ${queryUpper}, Username: ${username}`;
                } else {
                   textContent = `Match ID: ${matchId}, Username: ${username}`;
                }
                var tmp = createTableTR(textContent, `${basePath}index.html?matchid=${matchId}`, 'tdusersearchresult', '');
                tempElement.appendChild(tmp);
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

function createTableTR(text, href, textClass, hrefClass) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = text;
    td.classList.add('matchTextElement');
    if (textClass && textClass !== '') {
        const classes = textClass.split(',').map(cls => cls.trim());
        classes.forEach(cls => {
            if (cls) {
                td.classList.add(cls);
            }
        });
    }
    if (href) {
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.textContent = td.textContent;
        if (hrefClass && hrefClass !== '') {
            const classes = hrefClass.split(',').map(cls => cls.trim());
            classes.forEach(cls => {
                if (cls) {
                    anchor.classList.add(cls);
                }
            });
        }
        td.textContent = '';
        td.appendChild(anchor);
    }

    tr.appendChild(td);

    return tr;
}

document.addEventListener('DOMContentLoaded', async () => {
    var docroot = document.getElementById('docroot');
    if (!docroot) return console.error("Docroot element not found!");
    if (matchid) return await displayMatchDetails(matchid);
    if (chatid) return displayChatDetails(chatid);
    await fetch('matches.txt')
        .then(response => response.text())
        .then(allText => {
            const blocks = allText.split(/\r?\n\r?\n/);
            console.log(blocks.length)
            var x = 0
            const resultsWrapper = document.getElementsByClassName('results-wrapper')[0];
            if (resultsWrapper) {
                resultsWrapper.classList.remove('results-wrapper');
                resultsWrapper.classList.add('results-wrapper-search');
            } else {
                console.error("Results wrapper element not found!");
            }
            blocks.forEach(block => {
                const lines = block.split('\n');
                if (lines[0] == "") {
                    console.log("EOF")
                    return;
                }

                x += 1;
                docroot.appendChild(createTableTR(lines[0], `${basePath}index.html?matchid=${lines[0]}`, 'matchTextElement', ''));
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
