chrome.storage.sync.get(null, options => {

  // Grab a ref to the Streams element and create a variable for storing the active tab
  const Streams = document.getElementById("Streams");
  var activeTab = null,
      pinTabs = options.pinTabs,
      theme = options.theme;

  // Store a reference to the current tab so we can highlight the appropriate stream in our UI
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    activeTab = tabs[0];
  });

  // Set the UI Theme
  if (theme != undefined) {
    document.documentElement.setAttribute('data-theme', theme)
  }

  // Connect to the messaging port...
  const port = chrome.runtime.connect({ name: 'slipstream' });

  // When we get a message from the background script, kick things off!
  port.onMessage.addListener(message => {

    if (message.streams) {
      let streams = message.streams;
      Streams.innerHTML = "";

      Streams.appendChild(actionsBar(streams))

      // If there aren't any streams, generate a music quote.
      if (message.streams.length === 0) {
        Streams.appendChild(musicQuote())
        Streams.appendChild(savedStreamsList(Streams));
      } 
      // Otherwise, start building the UI.
      else {

        // Loop through the streams and build the popup UI accordingly
        message.streams.forEach(stream => {
          //console.log(stream)
          let tabId = stream.id

          let streamElement = document.createElement('li');
          streamElement.id = tabId;
          streamElement.className = stream.mutedInfo.muted ? "muted" : "active";

          // If this streaming tab id matches the current tab id, add the viewing class to the element
          if (stream.id == activeTab.id) { 
            streamElement.className += " viewing" 
          }

          streamElement.appendChild(streamIcon(stream))
          streamElement.appendChild(streamTitle(stream, streams, tabId))
          streamElement.appendChild(streamSpeaker(stream, streams, tabId))

          Streams.appendChild(streamElement)
        })
        Streams.appendChild(closeAllButton(streams))
        Streams.prepend(gradientBar())
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

    musicQuote.addEventListener("click", () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    })
    return musicQuote;
  }

  const getRandomInt = (min, max) => {
    // This is just for the Quote Generator
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  const gradientBar = () => {
    let gradientBar = document.createElement('div');
    gradientBar.id = "GradientBar"

    // Loop through the open tabs to see if any are making sound (aka streaming)
    chrome.tabs.query({audible: true, muted: false}, tabs => {
      // If so, animate the gradient bar
      if (tabs.length > 0) {
        gradientBar.className = "playing"
      }
    })

    return gradientBar;
  }
  const actionsBar = (streams) => {
    let actionsBar = document.createElement('div')

    actionsBar.id = "Actions"

    if (streams.length > 0) {
      let rightActions = document.createElement('div')

      actionsBar.appendChild(saveStreamsButton(streams))

      actionsBar.appendChild(muteButton(streams))
    }

    return actionsBar;
  }

  const savedStreamsList = (container) => {
    let savedList = document.createElement('div'),
        actions = document.createElement('div'),
        title = document.createElement('h3'),
        load = document.createElement('div')


    // Load the saved playlist from sync storage
    chrome.storage.sync.get(['streamList'], result => {
      let streams = JSON.parse(result.streamList),
          list = document.createElement('ul');

      // First, set up the "load all" event
      load.addEventListener("click", () => {
        // Loop through the saved streams
        streams.forEach(stream => {
          // Check if any of the stream is already open
          chrome.tabs.query({url: stream.url}, results => {
            // If so, close any open instances
            if (results.length !== 0) {
              results.forEach(tab => {
                chrome.tabs.remove(tab.id)
              })
            }
            // Then create a new instance of the tab
            chrome.tabs.create({url: stream.url, pinned: pinTabs})
          })
        })
      })
      // Loop through the streams and start building out the list ui
      streams.forEach(stream => {
        let streamElement = document.createElement('li');
        streamElement.id = stream.id;

        // If this streaming tab id matches the current tab id, add the viewing class to the element
        if (stream.id == activeTab.id) { 
          streamElement.className += " viewing" 
        }

        streamElement.appendChild(streamIcon(stream))
        streamElement.appendChild(streamTitle(stream, streams, stream.id, false))

        list.appendChild(streamElement)
      })

      savedList.id = "SavedList";
      actions.id = "SavedActions"
      load.id = "Load"
      title.innerText = "Saved Streams"
      load.innerText = "LOAD ALL"

      actions.appendChild(title)
      actions.appendChild(load)
      savedList.appendChild(actions)

      savedList.appendChild(list)
    });

    return savedList;
  }

  const saveStreamsButton = (streams) => {
    let saveButton = document.createElement('div');

    saveButton.id = "Save"
    
    chrome.storage.sync.get(['streamList'], (result) => {
      let storedStreams = result.streamList,
          currentStreams = JSON.stringify(streams);

      if (streams.length > 0) {
        // Compare the urls in our current streams and the stored streams, returns a bool based on whether everything matches
        //console.log(streams, JSON.parse(storedStreams))
        let match = null;
        if (streams.length === JSON.parse(storedStreams).length) {
          match = JSON.parse(storedStreams).every((stream, index) => stream && stream.url == streams[index].url)
        }

        if (match === true) {
          saveButton.innerHTML = "STREAMS SAVED"
          saveButton.className = "saved"
        } else {
          if (streams.length > 1) {
            saveButton.innerHTML = "SAVE STREAMS"
          } else {
            saveButton.innerHTML = "SAVE STREAM"
          }
          saveButton.className = "unsaved"
          saveButton.addEventListener("click", () => {
            chrome.storage.sync.set({streamList: currentStreams}, () => {
              //console.log('Stored value ' + currentStreams);
              setTimeout(() => {location.reload()}, 200);
            });
          })
        }
      }
    })

    return saveButton
  }

  const muteButton = (streams) => {
    let muteButton = document.createElement('div'),
        allMuted = streams.every(stream => stream.mutedInfo.muted == true);

    muteButton.id = "Mute"

    if (!allMuted) {
      muteButton.innerHTML = "MUTE";
      muteButton.className = "unmuted"

      muteButton.addEventListener("click", () => {
        streams.forEach(stream => {
          chrome.tabs.update(stream.id, {muted: true});
          setTimeout(() => {location.reload()}, 200);
        })
      })
    } else {
      muteButton.innerHTML = "MUTED";
      muteButton.className = "muted"
    }

    return muteButton
  }

  const closeAllButton = (streams) => {
    let closeButton = document.createElement('div')

    closeButton.id = "Close"

    if (streams.length > 1) {
      closeButton.innerHTML = "LEAVE STREAMS";
    } else {
      closeButton.innerHTML = "LEAVE STREAM";
    }

    closeButton.addEventListener("click", () => {
      streams.forEach(stream => {
        chrome.tabs.remove(stream.id);
        setTimeout(() => {location.reload()}, 200);
      })
    })

    return closeButton
  }

  const streamIcon = (stream) => {
    let streamIcon = document.createElement('div'),
        streamIsOpen = false;

    streamIcon.className = "favIcon"
    streamIcon.title = "View Stream"
    streamIcon.setAttribute("style", "background-image: url(" + stream.favIconUrl + ");")


    // See if there are any tabs open right now with this url...
    chrome.tabs.query({url: stream.url}, result => {
      let streamData;
      if (result[0]) {
        streamIsOpen = true;
        streamData = result[0];
        console.log(streamData)
        //console.log(streamData.title, " is open now")
      }

      // If this stream is already open, clicking the track name should switch you to its tab
      // Otherwise, open a new tab with the stream.
      streamIcon.addEventListener('click', () => {
        if (streamIsOpen === true) {
          chrome.tabs.update(streamData.id, { 'active': true }, (tab) => { });
        } else if (streamIsOpen === false) {
          chrome.tabs.create({url: stream.url})
        }
      })
    })

    return streamIcon;
  }

  const streamTitle = (stream, streams, tabId, clickToMute = true) => {
    let streamTitle = document.createElement('div'),
    streamIsOpen = false;

    streamTitle.innerText = stream.title
    streamTitle.title = stream.title
    streamTitle.className = "streamTitle"

    if (clickToMute === true) {
      streamTitle.addEventListener('click', () => {

        streams.forEach(stream => {

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
    } else {
      chrome.tabs.query({url: stream.url}, result => {
        let streamData;
        if (result[0]) {
          streamIsOpen = true;
          streamData = result[0];
          console.log(streamData)
          //console.log(streamData.title, " is open now")
        }
    
        // If so, clicking the track name should switch you to that tab
        streamTitle.addEventListener('click', () => {
          if (streamIsOpen === true) {
            chrome.tabs.update(streamData.id, { 'active': true }, (tab) => { });
          } else if (streamIsOpen === false) {
            chrome.tabs.create({url: stream.url, pinned: pinTabs})
          }
        })
      })
    }

    return streamTitle
  }

  const streamSpeaker = (stream, streams, tabId) => {
    let streamState = document.createElement('div');

    streamState.className = "streamState"

    if (stream.mutedInfo.muted === false) {
      streamState.innerText = "🔊"
      streamState.title = "Playing"
    } else {
      streamState.innerText = "🔇"
      streamState.title = "Muted"
    }

    streamState.addEventListener('click', () => {
      streams.forEach(stream => {
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

})
