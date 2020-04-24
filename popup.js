// Grab a ref to the Streams element and create a variable for storing the active tab
const Streams = document.getElementById("Streams");
var activeTab = null;

// Store a reference to the current tab so we can highlight the appropriate stream in our UI
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  activeTab = tabs[0];
});

// Connect to the messaging port...
const port = chrome.runtime.connect({ name: 'slipstream' });

// When we get a message from the background script, kick things off!
port.onMessage.addListener(message => {
  if (message.streams) {
    Streams.innerHTML = "";

    // If there aren't any streams, generate a music quote.
    if (message.streams.length === 0) {
      // It'd be really cool if you could save sets of streams and then see them here when you aren't playing anything. Livestream playlists, basically. Just drop message.streams into localStorage and look for it anytime there's nothing playing. Overwrite it anytime someone saves another set.
      
      Streams.appendChild(musicQuote())
    } 
    // Otherwise, start building the UI.
    else {
      Streams.appendChild(muteButton(message.streams))

      // Loop through the streams and build the popup UI accordingly
      message.streams.forEach(stream => {
        console.log(stream)
        let tabId = stream.id

        let streamElement = document.createElement('li');
        streamElement.id = tabId;
        streamElement.className = stream.mutedInfo.muted ? "muted" : "active";

        // If this streaming tab id matches the current tab id, add the viewing class to the element
        if (stream.id == activeTab.id) { 
          streamElement.className += " viewing" 
        }

        streamElement.appendChild(streamIcon(stream))
        streamElement.appendChild(streamTitle(stream, message, tabId))
        streamElement.appendChild(streamSpeaker(stream, message, tabId))

        Streams.appendChild(streamElement)
      })

    }
  }
});

const musicQuote = () => {
  const quotes = [
          "Without music, life would be a mistake",
          "The only truth is music",
          "Without music, life would be a blank to me",
          "Where words fail, music speaks",
          "Who hears music, feels his solitude peopled at once",
          "If you cannot teach me to fly, teach me to sing",
          "Music is the strongest form of magic",
          "Music in the soul can be heard by the universe",
          "Music is the great uniter. An incredible force",
          "If music be the food of love, play on",
          "Music is the moonlight in the gloomy night of life",
          "Music tells us that the human race is greater than we realize"
        ],
        colors = [
          "#FFB6B6",
          "#FDE2E2",
          "#AACFCF",
          "#679B9B",
        ]
  
  // Set up the quote container
  let musicQuote = document.createElement('div')
  musicQuote.id = "Quote";
  
  // Generate the quote text, style it, etc.
  let quoteText = document.createElement('em')
  quoteText.setAttribute('style', 'color: ' + colors[getRandomInt(0, colors.length)] +';')
  quoteText.innerText = quotes[getRandomInt(0, quotes.length)]
  quoteText.prepend("✨")
  quoteText.append("✨")
  
  // Drop the text into the container and return the element
  musicQuote.appendChild(quoteText);
  return musicQuote;
}

const muteButton = (streams) => {
  let muteAll = document.createElement('div'),
      allMuted = streams.filter(stream => stream.mutedInfo.muted == true) ? true : false;
  muteAll.id = "Mute"

  if (allMuted) {
    muteAll.innerHTML = "🤫 MUTE ALL";

    muteAll.addEventListener("click", () => {
      streams.forEach(stream => {
        chrome.tabs.update(stream.id, {muted: true});
        setTimeout(() => {location.reload()}, 200);
      })
    })
  } else {
    muteAll.innerHTML = "😶 MUTED";
  }

  return muteAll
}

const streamIcon = (stream) => {
  let streamIcon = document.createElement('div')

  streamIcon.className = "favIcon"
  streamIcon.setAttribute("style", "background-image: url(" + stream.favIconUrl + ");")
  
  streamIcon.addEventListener('click', () => {
    chrome.tabs.update(stream.id, { 'active': true }, (tab) => { });
  })

  return streamIcon;
}

const streamTitle = (stream, message, tabId) => {
  let streamTitle = document.createElement('div')

  streamTitle.innerText = stream.title
  streamTitle.title = stream.title
  streamTitle.className = "streamTitle"

  streamTitle.addEventListener('click', () => {

    message.streams.forEach(stream => {

      // Mute everything except the stream we just clicked.
      if (stream.id !== tabId) {
        //console.log(stream.id)
        chrome.tabs.update(stream.id, {muted: true});
      } else if (stream.id === tabId) {
        chrome.tabs.update(stream.id, {muted: false});
      }
      setTimeout(() => {location.reload()}, 200);
    })
  })

  return streamTitle
}

const streamSpeaker = (stream, message, tabId) => {
  let streamState = document.createElement('div');

  streamState.className = "streamState"
  streamState.title = "Click to stream"

  if (stream.mutedInfo.muted === false) {
    streamState.innerText = "🔊"
  } else {
    streamState.innerText = "🔇"
  }

  streamState.addEventListener('click', () => {
    message.streams.forEach(stream => {
      // Mute everything except the stream we just clicked.
      if (stream.id !== tabId) {
        //console.log(stream.id)
        chrome.tabs.update(stream.id, {muted: true});
      } else if (stream.id === tabId) {
        chrome.tabs.update(stream.id, {muted: false});
      }
      setTimeout(() => {location.reload()}, 200);
    })

  })

  return streamState;
}

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}