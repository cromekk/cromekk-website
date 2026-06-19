const root = document.documentElement;
const clock = document.getElementById("clock");
const viewCount = document.getElementById("view-count");
const discordStatus = document.getElementById("discord-status");

const VIEW_COUNTER_KEY = "cromekk_personal_site_views_v1";

function updateMouse(clientX, clientY) {
  const x = (clientX / window.innerWidth - 0.5) * 2;
  const y = (clientY / window.innerHeight - 0.5) * 2;

  root.style.setProperty("--x", x.toFixed(3));
  root.style.setProperty("--y", y.toFixed(3));
}

window.addEventListener("mousemove", (event) => {
  updateMouse(event.clientX, event.clientY);
});

window.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.touches[0];
    updateMouse(touch.clientX, touch.clientY);
  },
  { passive: true }
);

function updateClock() {
  clock.textContent = new Date().toLocaleTimeString();
}

async function updateViewCounter() {
  try {
    const response = await fetch(
      `https://countapi.mileshilliard.com/api/v1/hit/${VIEW_COUNTER_KEY}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Counter request failed");
    }

    const data = await response.json();
    viewCount.textContent = Number(data.value).toLocaleString();
  } catch (error) {
    console.error(error);
    viewCount.textContent = "unavailable";
  }
}

function setAlwaysOnlineStatus() {
  discordStatus.textContent = "● online";
  discordStatus.className = "status-text status-online";
}

updateClock();
setInterval(updateClock, 1000);

updateViewCounter();
setAlwaysOnlineStatus();
