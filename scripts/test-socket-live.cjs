const { io } = require("../Dashboard_client-main/node_modules/socket.io-client");

const token = process.env.TEST_SOCKET_TOKEN;
const userId = process.env.TEST_SOCKET_USER_ID;
const emitSecret = process.env.TEST_SOCKET_EMIT_SECRET;
if (!token || !userId || !emitSecret) {
  throw new Error("Socket test credentials are required");
}

function connect(tokenValue, verifyEvent = false) {
  return new Promise((resolve) => {
    const socket = io("http://localhost:3001", {
      auth: { token: tokenValue },
      reconnection: false,
      timeout: 5000,
    });
    const result = {
      connected: false,
      syncRequired: false,
      room: null,
      eventReceived: false,
      error: null,
    };
    const finish = () => {
      socket.disconnect();
      resolve(result);
    };

    socket.on("sync-required", () => {
      result.syncRequired = true;
    });
    socket.on("notification", (notification) => {
      if (verifyEvent && String(notification?.userId) === String(userId)) {
        result.eventReceived = true;
        finish();
      }
    });
    socket.on("connect", () => {
      result.connected = true;
      socket.emit("join-user", "another-user", (acknowledgement) => {
        result.room = acknowledgement?.room ?? null;
        if (!verifyEvent) {
          setTimeout(finish, 100);
          return;
        }
        fetch("http://localhost:3001/emit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: emitSecret,
            event: "notification",
            data: {
              userId: Number(userId),
              id: 999999,
              title: "Realtime audit",
              message: "Socket delivery verified",
              type: "PAYMENT_PENDING",
              read: false,
              createdAt: new Date().toISOString(),
            },
          }),
        }).then((response) => {
          if (!response.ok) {
            result.error = `Emit failed with ${response.status}`;
            finish();
          }
        }).catch((error) => {
          result.error = error.message;
          finish();
        });
        setTimeout(() => {
          if (!result.eventReceived) {
            result.error = result.error ?? "Timed out waiting for notification";
            finish();
          }
        }, 3000);
      });
    });
    socket.on("connect_error", (error) => {
      result.error = error.message;
      socket.disconnect();
      resolve(result);
    });
  });
}

Promise.all([connect(token, true), connect("invalid-token")])
  .then(([valid, invalid]) => {
    process.stdout.write(`${JSON.stringify({ valid, invalid })}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
