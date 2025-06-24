const clientId = 'vup20nerd0t1sc70uamrau0uqagni8';
const redirectUri = 'https://steelmarvel.com/';
const fixedUsername = 'loserfruit';

const tokenMatch = window.location.hash.match(/access_token=([^&]*)/);
const accessToken = tokenMatch ? tokenMatch[1] : null;

function getStreamDuration(startedAt) {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now - start;

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}


function updateDurations() {
  const durationSpan = document.querySelector('.duration');
  if (!durationSpan) return;

  const startedAt = durationSpan.getAttribute('data-started');
  if (!startedAt) return;

  durationSpan.textContent = getStreamDuration(startedAt);
}

// Start the interval
setInterval(updateDurations, 1000);
updateDurations(); // Run once immediately


if (!accessToken) {
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=user:read:email`;
  window.location.href = authUrl;
} else {
  window.history.replaceState({}, document.title, redirectUri);
  const statusDiv = document.getElementById('twitch-status');

  function checkStream(username) {
    fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(res => res.json())
    .then(userData => {
      const userId = userData.data[0]?.id;
      if (!userId) {
        statusDiv.textContent = 'User not found.';
        return;
      }

      return fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`
        }
      });
    })
    .then(res => res?.json())
    .then(streamData => {
      const stream = streamData?.data?.[0];
      if (stream) {
        statusDiv.innerHTML = `
          <h2 class="twitch-live-h2 uppercase">Happening Now</h2>
          <div class="live-stream">
            <span class="stream-announcement"><span class="bold">${fixedUsername}</span> is LIVE
              <img class="twitch-live-thumbnail" alt="Thumbnail of ${fixedUsername}'s stream." height="60" src="${stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180')}"></span>
            <span class="twitch-live-pulse-wrap">
              <span class="pulse red"></span>
            </span>
            <span class=stream-title>${stream.title}</span>
            <span class="twitch-live-game"><img class="twitch-live-game-img" alt="Game" src="/elements/game.svg"><a class="twitch-live-game-link" href="https://www.twitch.tv/directory/game/${encodeURIComponent(stream.game_name)}" target="_blank">${stream.game_name}</a></span>
            <span class="twitch-live-viewers"><img class="twitch-live-viewer-img" alt="Viewers" src="/elements/viewers.svg">${stream.viewer_count.toLocaleString()}</span>
            <span class="twitch-live-duration">Started at ${new Date(stream.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} (<span class="duration" data-started="${stream.started_at}"></span> ago)</span>
            <a class="twitch-live-logo-wrapper" href="https://www.twitch.tv/${fixedUsername}" target="_blank"><img class="twitch-live-logo" alt="Twitch - ${fixedUsername}" src="/elements/twitch.svg"></a>
            <a href="https://www.twitch.tv/${fixedUsername}" target="_blank" class="twitch-live-cta">Watch on Twitch<span class="twitch-live-cta-arrow">></span></a>
          </div>
        `;
      } else {
        statusDiv.innerHTML = '';
      }
    })
    .catch(err => {
      console.error(err);
      statusDiv.textContent = 'Error checking stream.';
    });
  }

  // Automatically check SteelMarvel
  checkStream(fixedUsername);

  setInterval(() => checkStream(fixedUsername), 60000);
}