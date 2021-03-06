// Saves options to chrome.storage
function save_options() {
  var pinTabs = document.getElementById('pinTabs').checked,
      theme = document.getElementById('theme').value;
  console.log(theme)
  chrome.storage.sync.set({
    pinTabs: pinTabs,
    theme: theme,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    document.getElementById("saveOptions").disabled = true;
    status.className = "";
    status.innerText = '🤘';
    location.reload()
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    pinTabs: true,
    theme: "dark",
  }, function(options) {
    console.log(options)
    document.getElementById('pinTabs').checked = options.pinTabs;
    document.getElementById('theme').value = options.theme;

    if (options.theme === "dark") {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.getElementById('logo').setAttribute('src', 'logo_large_dark.svg')
      document.getElementById('status').innerText = "🤘";
      document.getElementById('author').innerText = "Courtesy of Covid © 2020";
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      document.getElementById('logo').setAttribute('src', 'logo_large.svg')
      document.getElementById('status').innerText = "🎶";
      document.getElementById('author').innerText = "Social Distance Squad © 2020";
    }
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveOptions').addEventListener('click', save_options);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input, select').forEach(element => {
    element.addEventListener("click", () => {
      document.getElementById("saveOptions").disabled = false;
      document.getElementById("status").className = "hidden";
    })
  })
});