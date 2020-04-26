// Saves options to chrome.storage
function save_options() {
  var pinTabs = document.getElementById('pinTabs').checked;
  chrome.storage.sync.set({
    pinTabs: pinTabs,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    document.getElementById("saveOptions").disabled = true;
    status.className = "";
    status.innerText = '🤘';
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    pinTabs: true
  }, function(options) {
    document.getElementById('pinTabs').checked = options.pinTabs;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveOptions').addEventListener('click', save_options);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input').forEach(element => {
    element.addEventListener("click", () => {
      document.getElementById("saveOptions").disabled = false;
      document.getElementById("status").className = "hidden";
    })
  })
});