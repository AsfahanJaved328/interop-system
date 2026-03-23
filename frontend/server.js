import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server(httpServer, { path: "/socket.io" });

  io.on("connection", (socket) => {
    const interval = setInterval(() => {
      socket.emit("notification", {
        id: Date.now().toString(),
        title: "New Intent",
        message: "Intent created and routed",
        level: "info"
      });
    }, 5000);
    socket.on("disconnect", () => clearInterval(interval));
  });

  httpServer.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
  });
});
