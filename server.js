var cors = require('cors')


const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const redis = require("redis");
require("dotenv").config();
const { createClient } = redis;
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const is = socketio(server);

// require the socket.io module
const io = new is(http, {
  cors: {
    origin: "http://localhost:8888", // 클라이언트의 주소를 허용
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

const port = 3001;

// 미들웨어 설정
//미들웨어란: 요청과 응답의 중간에 위치하며 클라이언트에게 요청이 오면
//그 요청에 대한 응답을 보내기 위해 중간에서 목적에 맞게 처리를 해주는 함수
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:8888", // 스프링 서버 주소
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

app.use(cors({
  origin: "http://localhost:8888", // 클라이언트의 주소를 허용
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
}));

const botName = "ChatCord Bot";

// (async () => {
//   pubClient = createClient({ url: "redis://127.0.0.1:6379" });
//   await pubClient.connect();
//   subClient = pubClient.duplicate();
//   io.adapter(createAdapter(pubClient, subClient));
// })();

// Run when client connects
io.on("connection", (socket) => {
  console.log(io.of("/").adapter);
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
