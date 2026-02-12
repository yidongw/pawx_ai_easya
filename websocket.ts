/* eslint-disable no-console */
const REMOTE_WS_URL = 'wss://p01--pawx-monitor--9l94zqsfq2bp.code.run/ws/allenorYugANzHKl';
const LOCAL_PORT = 3001;
const TWEETS_FILE_NAME = 'tweets.json';
const FLUSH_INTERVAL_MS = 1000;
const MAX_BUFFER_SIZE = 20;

// 1. Define the list of users to subscribe to
const RAW_USERS = [
  "pawx_ai",
  "allenpaper0915"
];

// Clean the user list (remove spaces)
const TARGET_USERS = RAW_USERS.map(u => u.trim());

// 2. Setup the Local WebSocket Server (to serve the frontend)
const server = Bun.serve({
  port: LOCAL_PORT,
  fetch(req, server) {
    // Upgrade HTTP request to WebSocket
    if (server.upgrade(req)) {
      return;
    }
    return new Response("WebSocket Relay Server Running. Connect via WebSocket.", { status: 200 });
  },
  websocket: {
    open(ws) {
      console.log(`[Local] Client connected`);
      ws.subscribe("updates"); // Subscribe this client to the 'updates' topic
      
      // Send initial status
      ws.send(JSON.stringify({ 
        type: 'system', 
        message: 'Connected to Relay Server',
        upstreamStatus: upstreamWS && upstreamWS.readyState === WebSocket.OPEN ? 'Connected' : 'Connecting...'
      }));
    },
    close(ws) {
      console.log(`[Local] Client disconnected`);
      ws.unsubscribe("updates");
    },
    message(ws, message) {
      // Handle messages from frontend if needed (e.g., ping)
    }
  }
});

console.log(`✅ Local Relay Server listening on ws://localhost:${LOCAL_PORT}`);

// 3. Setup the Upstream WebSocket Client (to connect to Twitter Monitor)
let upstreamWS: WebSocket | null = null;
let reconnectInterval: ReturnType<typeof setInterval> | null = null;
let cachedTweets: any[] | null = null;
let tweetBuffer: any[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

function connectToUpstream() {
  console.log(`[Upstream] Connecting to ${REMOTE_WS_URL}...`);
  upstreamWS = new WebSocket(REMOTE_WS_URL);

  upstreamWS.addEventListener('open', () => {
    console.log(`[Upstream] Connected!`);
    broadcast({ type: 'system', message: 'Upstream Connected', upstreamStatus: 'Connected' });
  });

  upstreamWS.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data as string);
      
      // Relay the message to all local clients
      broadcast(message);

      // Handle specific upstream logic
      if (message.type === 'connected') {
        console.log(`[Upstream] Received 'connected' message. Subscribing to ${TARGET_USERS.length} users...`);
        subscribeToUsers();
      } else if (message.type === 'error') {
        console.error(`[Upstream] Error:`, message.message);
      } else if (message.type === 'user-update') {
        // console.log(`[Upstream] Update from @${message.data.twitterUser.screenName}`);
        saveTweetToFile(message.data);
      }

    } catch (e) {
      console.error(`[Upstream] Error parsing message:`, e);
    }
  });

  upstreamWS.addEventListener('close', () => {
    console.log(`[Upstream] Disconnected. Reconnecting in 5s...`);
    broadcast({ type: 'system', message: 'Upstream Disconnected', upstreamStatus: 'Disconnected' });
    upstreamWS = null;
    setTimeout(connectToUpstream, 5000);
  });

  upstreamWS.addEventListener('error', (err) => {
    console.error(`[Upstream] Connection Error:`, err);
  });
}

// Helper to broadcast to local clients
function broadcast(data: any) {
  server.publish("updates", JSON.stringify(data));
}

// Function to subscribe to the list of users
function subscribeToUsers() {
  if (!upstreamWS || upstreamWS.readyState !== WebSocket.OPEN) return;

  console.log(`[Upstream] Sending subscription requests...`);
  
  // Batch subscriptions slightly to avoid flooding if needed, 
  // but usually sending all at once is fine for < 50 users
  TARGET_USERS.forEach((username, index) => {
    // Add a tiny delay to prevent rate limits if strict
    setTimeout(() => {
      if (upstreamWS && upstreamWS.readyState === WebSocket.OPEN) {
        upstreamWS.send(JSON.stringify({
          type: 'subscribe',
          twitterUsername: username
        }));
        // console.log(`[Upstream] Subscribed to ${username}`);
      }
    }, index * 50); // 50ms interval
  });
}

// Start the upstream connection
connectToUpstream();

// Helper to save tweet to file
async function saveTweetToFile(data: any) {
  try {
    const { twitterUser, status } = data;
    // Only save if there is a tweet (status object exists)
    if (!status) return;

    const tweetEntry = {
      user: {
        name: twitterUser.name,
        screenName: twitterUser.screenName,
        profileImageUrlHttps: twitterUser.profileImageUrlHttps
      },
      text: status.full_text || status.text,
      stats: {
        favoriteCount: status.favorite_count ?? status.favoriteCount ?? 0,
        retweetCount: status.retweet_count ?? status.retweetCount ?? 0,
        bookmarkCount: status.bookmark_count ?? status.bookmarkCount ?? 0,
        viewCount: status.view_count ?? status.viewCount ?? 0,
        quoteCount: status.quote_count ?? status.quoteCount ?? 0,
        replyCount: status.reply_count ?? status.replyCount ?? 0
      },
      dates: {
        createdAt: status.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    tweetBuffer.push(tweetEntry);
    if (tweetBuffer.length >= MAX_BUFFER_SIZE) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      void flushTweets();
    } else if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        void flushTweets();
      }, FLUSH_INTERVAL_MS);
    }
  } catch (err) {
    console.error(`[Storage] Failed to save tweet: ${err}`);
  }
}

async function flushTweets() {
  if (isFlushing || tweetBuffer.length === 0) {
    return;
  }
  isFlushing = true;
  const pending = tweetBuffer;
  tweetBuffer = [];

  try {
    if (!cachedTweets) {
      const file = Bun.file(TWEETS_FILE_NAME);
      if (await file.exists()) {
        try {
          const parsed = await file.json();
          cachedTweets = Array.isArray(parsed) ? parsed : [];
        } catch {
          cachedTweets = [];
        }
      } else {
        cachedTweets = [];
      }
    }

    cachedTweets.push(...pending);
    await Bun.write(TWEETS_FILE_NAME, `${JSON.stringify(cachedTweets, null, 2)}\n`);
    console.log(`[Storage] Saved ${pending.length} tweet(s) to ${TWEETS_FILE_NAME}`);
  } catch (err) {
    console.error(`[Storage] Failed to save tweet batch: ${err}`);
  } finally {
    isFlushing = false;
    if (tweetBuffer.length > 0) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      void flushTweets();
    }
  }
}