const root = document.documentElement;
const wrap = document.querySelector(".wrap");
const card = document.querySelector(".card");
const clock = document.getElementById("clock");
const viewCount = document.getElementById("view-count");
const discordStatus = document.getElementById("discord-status");
const discordAvatar = document.getElementById("discord-avatar");
const discordProfile = document.getElementById("discord-profile");
const activityTitle = document.getElementById("activity-title");
const activityDetail = document.getElementById("activity-detail");
const activityApp = document.querySelector(".app");

const VIEW_COUNTER_KEY = "cromekk_personal_site_views_v1";
const DISCORD_USER_ID = "1468903546576437472";
const DISCORD_API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;
const DISCORD_REFRESH_MS = 60 * 1000;
const VIEWPORT_SAFE_GAP = 48;

const USE_LANYARD_PRESENCE = false;
const MANUAL_DISCORD_PRESENCE = {
  status: "online",
  profile: "Profile cromekk (@cromekk)",
  title: "Building software",
  detail: "Role Software Developer",
  app: "</>",
};

const statusLabels = {
  online: "online on Discord",
  idle: "idle on Discord",
  dnd: "do not disturb",
  offline: "offline on Discord",
};

const activityLabels = {
  0: "Playing",
  1: "Streaming",
  2: "Listening to",
  3: "Watching",
  5: "Competing in",
};

const motion = {
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
  frame: null,
};

let fitScaleFrame = null;
let currentFitScale = null;

function getMaxScale() {
  return window.matchMedia("(max-width: 630px)").matches ? 1 : 0.9;
}

function updateFitScale() {
  if (!wrap || !card) {
    return;
  }

  const maxScale = getMaxScale();

  if (currentFitScale === null) {
    currentFitScale = maxScale;
    root.style.setProperty("--site-scale", currentFitScale.toFixed(3));
  }

  const rect = card.getBoundingClientRect();
  const availableWidth = window.innerWidth - VIEWPORT_SAFE_GAP * 2;
  const availableHeight = window.innerHeight - VIEWPORT_SAFE_GAP * 2;
  const widthRatio = availableWidth / rect.width;
  const heightRatio = availableHeight / rect.height;
  const bottomRatio = (window.innerHeight - VIEWPORT_SAFE_GAP) / rect.bottom;
  const nextScale = Math.min(maxScale, currentFitScale * widthRatio, currentFitScale * heightRatio, currentFitScale * bottomRatio);

  const clampedScale = Math.max(0.42, nextScale);
  const changed = Math.abs(clampedScale - currentFitScale) > 0.003;

  currentFitScale = clampedScale;
  root.style.setProperty("--site-scale", currentFitScale.toFixed(3));
  fitScaleFrame = null;

  if (changed) {
    scheduleFitScale();
  }
}

function scheduleFitScale() {
  if (fitScaleFrame) {
    return;
  }

  fitScaleFrame = requestAnimationFrame(updateFitScale);
}

function setMotionTarget(clientX, clientY) {
  const x = (clientX / window.innerWidth - 0.5) * 2;
  const y = (clientY / window.innerHeight - 0.5) * 2;

  motion.targetX = Math.max(-1, Math.min(1, x));
  motion.targetY = Math.max(-1, Math.min(1, y));

  if (!motion.frame) {
    motion.frame = requestAnimationFrame(updateMotion);
  }
}

function updateMotion() {
  motion.currentX += (motion.targetX - motion.currentX) * 0.16;
  motion.currentY += (motion.targetY - motion.currentY) * 0.16;

  root.style.setProperty("--x", motion.currentX.toFixed(3));
  root.style.setProperty("--y", motion.currentY.toFixed(3));

  const settled =
    Math.abs(motion.targetX - motion.currentX) < 0.001 &&
    Math.abs(motion.targetY - motion.currentY) < 0.001;

  if (settled) {
    motion.currentX = motion.targetX;
    motion.currentY = motion.targetY;
    root.style.setProperty("--x", motion.currentX.toFixed(3));
    root.style.setProperty("--y", motion.currentY.toFixed(3));
    motion.frame = null;
    return;
  }

  motion.frame = requestAnimationFrame(updateMotion);
}

function bindMotion() {
  if ("PointerEvent" in window) {
    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "touch" && !event.isPrimary) {
          return;
        }

        setMotionTarget(event.clientX, event.clientY);
      },
      { passive: true }
    );

    window.addEventListener("pointerleave", () => {
      setMotionTarget(window.innerWidth / 2, window.innerHeight / 2);
    });

    return;
  }

  window.addEventListener("mousemove", (event) => {
    setMotionTarget(event.clientX, event.clientY);
  });

  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];

      if (touch) {
        setMotionTarget(touch.clientX, touch.clientY);
      }
    },
    { passive: true }
  );
}

function bindFitScale() {
  window.addEventListener("resize", scheduleFitScale, { passive: true });
  window.addEventListener("orientationchange", scheduleFitScale, { passive: true });

  if ("ResizeObserver" in window && card) {
    const observer = new ResizeObserver(scheduleFitScale);
    observer.observe(card);
  }
}

function updateClock() {
  if (clock) {
    clock.textContent = new Date().toLocaleTimeString();
  }
}

function cleanFooterLabel() {
  if (!viewCount || !viewCount.parentElement) {
    return;
  }

  viewCount.parentElement.replaceChildren(viewCount, document.createTextNode(" views"));
}

async function updateViewCounter() {
  if (!viewCount) {
    return;
  }

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

function setDiscordStatus(status, label = statusLabels[status]) {
  if (!discordStatus) {
    return;
  }

  const knownStatus = Object.prototype.hasOwnProperty.call(statusLabels, status)
    ? status
    : "offline";

  discordStatus.textContent = label || statusLabels[knownStatus];
  discordStatus.className = `status-text status-${knownStatus}`;
}

function setDefaultActivity() {
  if (activityTitle) {
    activityTitle.textContent = "Building software";
  }

  if (activityDetail) {
    activityDetail.textContent = "Role Software Developer";
  }

  if (activityApp) {
    activityApp.textContent = "</>";
  }
}

function setDiscordAvatar(user) {
  if (!user || !user.avatar || !discordAvatar) {
    return;
  }

  const extension = user.avatar.startsWith("a_") ? "gif" : "png";
  const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`;

  discordAvatar.textContent = "";
  discordAvatar.style.backgroundImage = `url("${avatarUrl}")`;
  discordAvatar.classList.add("has-image");
}

function setDiscordProfile(user) {
  if (!user || !discordProfile) {
    return;
  }

  const displayName = user.global_name || user.username || "cromekk";
  const username = user.username ? `@${user.username}` : "@cromekk";

  discordProfile.textContent = `Profile ${displayName} (${username})`;
}

function getSpotifyActivity(data) {
  if (!data.spotify) {
    return null;
  }

  return {
    title: "Listening to Spotify",
    detail: [data.spotify.song, data.spotify.artist].filter(Boolean).join(" - "),
    app: "SP",
  };
}

function pickDiscordActivity(activities = []) {
  return (
    activities.find((activity) => activity.type !== 4 && activity.name !== "Custom Status") ||
    activities.find((activity) => activity.type === 4) ||
    null
  );
}

function formatActivity(activity) {
  if (!activity) {
    return null;
  }

  if (activity.type === 4) {
    return {
      title: "Custom status",
      detail: activity.state || "On Discord",
      app: "RPC",
    };
  }

  const prefix = activityLabels[activity.type] || "Using";
  const detail = [activity.details, activity.state].filter(Boolean).join(" - ");

  return {
    title: `${prefix} ${activity.name}`,
    detail: detail || "Discord activity detected",
    app: "RPC",
  };
}

function renderActivity(data) {
  const activity = getSpotifyActivity(data) || formatActivity(pickDiscordActivity(data.activities));

  if (!activity) {
    setDefaultActivity();
    return;
  }

  if (activityTitle) {
    activityTitle.textContent = activity.title;
  }

  if (activityDetail) {
    activityDetail.textContent = activity.detail;
  }

  if (activityApp) {
    activityApp.textContent = activity.app;
  }

  scheduleFitScale();
}

function renderManualPresence() {
  setDiscordStatus(MANUAL_DISCORD_PRESENCE.status);

  if (discordProfile) {
    discordProfile.textContent = MANUAL_DISCORD_PRESENCE.profile;
  }

  if (activityTitle) {
    activityTitle.textContent = MANUAL_DISCORD_PRESENCE.title;
  }

  if (activityDetail) {
    activityDetail.textContent = MANUAL_DISCORD_PRESENCE.detail;
  }

  if (activityApp) {
    activityApp.textContent = MANUAL_DISCORD_PRESENCE.app;
  }

  scheduleFitScale();
}

async function updateDiscordPresence() {
  if (!USE_LANYARD_PRESENCE) {
    renderManualPresence();
    return;
  }

  setDiscordStatus("offline", "checking Discord...");

  try {
    const response = await fetch(DISCORD_API_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Discord presence request failed");
    }

    const payload = await response.json();

    if (!payload.success || !payload.data) {
      throw new Error("Discord presence is unavailable");
    }

    setDiscordStatus(payload.data.discord_status || "offline");
    setDiscordProfile(payload.data.discord_user);
    setDiscordAvatar(payload.data.discord_user);
    renderActivity(payload.data);
    scheduleFitScale();
  } catch (error) {
    console.warn(error);
    setDiscordStatus("offline", "Discord unavailable");
    setDefaultActivity();
    scheduleFitScale();
  }
}

cleanFooterLabel();
bindFitScale();
bindMotion();
scheduleFitScale();

updateClock();
setInterval(updateClock, 1000);

updateViewCounter();
updateDiscordPresence();
setInterval(updateDiscordPresence, DISCORD_REFRESH_MS);
