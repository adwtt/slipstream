var streamList = [];

// Figuring out how to persist extension state even when the background script goes inactive. When that happens today, the streamList gets lost completely. This drops the UI back into the "no streams" state when the user clocks to bring it up. Not great!

// Luckily, this seems to fix it!
chrome.storage.local.get("backgroundStreams", storage => {
  console.log(storage.backgroundStreams)
  if (storage.backgroundStreams) {
    streamList = JSON.parse(storage.backgroundStreams)
  }
});

// This is where we initialize the extension, noting the number of tabs streaming audio at launch
chrome.runtime.onInstalled.addListener((e) => {

  chrome.storage.local.get("backgroundStreams", storage => {
    console.log(storage.backgroundStreams)
    if (storage.backgroundStreams) {
      streamList = JSON.parse(storage.backgroundStreams)
    }
  });
  
  chrome.tabs.query({audible: true}, tabs => {
    streamList = tabs.filter(tab => tab.audible === true);

    chrome.browserAction.setBadgeBackgroundColor({color: '#000'});
    chrome.browserAction.setBadgeText({text: streamList.length.toString()});
    //chrome.browserAction.setTitle({"title": "Playing: " + streamList.filter(stream => stream.mutedInfo.muted == false)[0].title});
  })
})

// This is where we listen for tab changes and update the extension state accordingly
chrome.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  console.log(changeInfo)
  // We'll be looking out for "audible === true", since those are the only tabs we care about.
  if (changeInfo.hasOwnProperty('audible') || changeInfo.hasOwnProperty('mutedInfo')) {

    // Hand a tab becoming inaudible
    if (changeInfo.audible === false) {
      // Double check there's anything in the streamlist, then remove this tab from the list.
      if (streamList.length > 0) {
        streamList = streamList.filter(stream => stream.id !== tab.id)
        console.log("Stream removed: ", streamList)
        //chrome.tabs.update(id, {pinned: false});
        // If there's only one tab left, unmute it and refresh the streamList
        if (streamList.length == 1) {

          chrome.tabs.query({audible: true}, tabs => {
            streamList = tabs.filter(tab => tab.audible === true);
          })
        }
      }
    } 
    // Handle a tab becoming audible
    else if (changeInfo.audible === true) {
      let tabId = tab.id;
  
      chrome.tabs.query({audible: true}, tabs => {
        // If the user is viewing this newly audible tab, switch the audio
        if (tab.active === true) {
          tabs.forEach(tab => {
            if (tab.id !== tabId) {
              //console.log(stream.id)
              chrome.storage.sync.get(["pinTabs"], options => {
                chrome.tabs.update(tab.id, {muted: true, pinned: options.pinTabs});
              })
            } else if (tab.id === tabId) {
              chrome.storage.sync.get(["pinTabs"], options => {
                chrome.tabs.update(tab.id, {muted: false, pinned: options.pinTabs});
              })
            }
          })
        }
        // Otherwise, mute the channel. This stops audible changes in the background from hijacking the audio
        else {
          tabs.forEach(tab => {
            if (tab.id !== tabId) {
              //console.log(stream.id)
              //chrome.tabs.update(tab.id, {muted: true});
            } else if (tab.id === tabId) {
              chrome.storage.sync.get(["pinTabs"], options => {
                chrome.tabs.update(tab.id, {muted: true, pinned: options.pinTabs});
              })
            }
          })
        }

        streamList = tabs.filter(tab => tab.audible === true);
        chrome.browserAction.setBadgeText({text: streamList.length.toString()});
      })

      // Then shoot the updated streamlist over to the UI.
      chrome.runtime.onConnect.addListener(port => {
        console.assert(port.name == "slipstream");
        chrome.storage.local.set({backgroundStreams: JSON.stringify(streamList)});
        port.postMessage({ streams: streamList});
      })
    } 

    // Handle muting/unmuting a tab (technically this happens over in the UI, we're just updating the streamlist and browserAction title)
    else if (changeInfo.mutedInfo) {
      
      // If the tab change involves unmuting a tab, we can infer that's the stream our user just selected. Update the browserAction tooltip to reflect the new active stream.
      if (changeInfo.mutedInfo.muted === false) {
        chrome.browserAction.setTitle({"title": "Playing: " + tab.title});
      }

      // If the update has something to do with muting, refresh our streamList array. The UI will reload after 200ms and check this updated array
      chrome.tabs.query({audible: true}, tabs => {      
        streamList = tabs.filter(tab => tab.audible === true);
      })

      // Then shoot the updated streamlist over to the UI.
      chrome.runtime.onConnect.addListener(port => {
        console.assert(port.name == "slipstream");
        chrome.storage.local.set({backgroundStreams: JSON.stringify(streamList)});
        port.postMessage({ streams: streamList});
      })
    }
    chrome.browserAction.setBadgeText({text: streamList.length.toString()});
  }

  // Handle cool sites like youtube that don't load the title for a second.
  // This avoids having the stream appear generically as "Youtube" in the UI
  if (changeInfo.title) {
    chrome.tabs.query({audible: true}, tabs => {
      streamList = tabs;
      chrome.runtime.onConnect.addListener(port => {
        console.assert(port.name == "slipstream");
        chrome.storage.local.set({backgroundStreams: JSON.stringify(streamList)});
        port.postMessage({ streams: streamList});
      })
    })
  }
})

// This is where we listen for tabs closing and update our extension state accordingly
chrome.tabs.onRemoved.addListener((id, removeInfo) => {
  // Filter the closed tab id from our list of streaming tabs
  streamList = streamList.filter(stream => stream.id !== id)

  // If there's only one tab left, unmute it and refresh the streamList
  if (streamList.length == 1) {
    chrome.tabs.update(streamList[0].id, {muted: false});

    chrome.tabs.query({audible: true}, tabs => {
      streamList = tabs.filter(tab => tab.audible === true);
    })

    chrome.runtime.onConnect.addListener(port => {
      console.assert(port.name == "slipstream");
      chrome.storage.local.set({backgroundStreams: JSON.stringify(streamList)});
      port.postMessage({ streams: streamList});
    })
  }

  // Update the browseraction icon info
  chrome.browserAction.setBadgeText({text: streamList.length.toString()});
})

// This is where we set up a communication line between this script and the UI
// connect to a custom channel/port
chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name == "slipstream");

  chrome.storage.local.set({backgroundStreams: JSON.stringify(streamList)});
  port.postMessage({ streams: streamList});
  
  port.onMessage.addListener(message => {
    console.log(message)
  })
})