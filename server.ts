import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));

// 방 상태 인터페이스
interface RoomData {
  members: Map<string, string>; // userId -> nickName
  step1: Map<string, number[]>; // userId -> [card1, card2]
  step2: Map<string, number>; // userId -> chosenCard
  scores: Map<string, number>; // userId -> accumulated score
}

const rooms = new Map<string, RoomData>();

io.on("connection", (socket: Socket) => {
  console.log(`[${socket.id}] connected`);

  socket.on("createRoom", (roomId: string, cb: (ok: boolean) => void) => {
    if (rooms.has(roomId)) return cb(false);
    rooms.set(roomId, {
      members: new Map(),
      step1: new Map(),
      step2: new Map(),
      scores: new Map(),
    });
    cb(true);
  });

  socket.on("joinRoom", (params, cb) => {
    const { roomId, userId, nickName } = params;
    const room = rooms.get(roomId);
    if (!room) return cb({ ok: false });
    socket.join(roomId);
    room.members.set(userId, nickName);
    if (!room.scores.has(userId)) room.scores.set(userId, 0);
    const list = Array.from(room.members.entries()).map(([uid, nn]) => ({
      userId: uid,
      nickName: nn,
      score: room.scores.get(uid)!,
    }));
    io.in(roomId).emit("members", list);
    cb({ ok: true, members: list });
  });

  socket.on("leaveRoom", (params, cb) => {
    const { roomId, userId } = params;
    const room = rooms.get(roomId);
    if (!room) return cb(false);
    socket.leave(roomId);
    room.members.delete(userId);
    room.step1.delete(userId);
    room.step2.delete(userId);
    room.scores.delete(userId);
    const list = Array.from(room.members.entries()).map(([uid, nn]) => ({
      userId: uid,
      nickName: nn,
      score: room.scores.get(uid)!,
    }));
    io.in(roomId).emit("members", list);
    cb(true);
  });

  socket.on("message", (chat, cb) => {
    const [roomId] = Array.from(socket.rooms).filter((r) => r !== socket.id);
    if (roomId) io.in(roomId).emit("message", chat);
    cb?.();
  });

  // 1단계: 두 카드 제출
  socket.on("step1", (params, cb) => {
    const { roomId, userId, cards } = params;
    const room = rooms.get(roomId);
    if (!room) return cb({ ok: false, error: "no room" });
    room.step1.set(userId, cards);
    if (room.step1.size === room.members.size) {
      io.in(roomId).emit(
        "step1Result",
        Array.from(room.step1.entries()).map(([uid, cs]) => ({
          userId: uid,
          cards: cs,
        }))
      );
    }
    cb({ ok: true });
  });

  // 2단계: 카드 하나 선택
  socket.on("step2", (params, cb) => {
    const { roomId, userId, card } = params;
    const room = rooms.get(roomId);
    if (!room) return cb({ ok: false, error: "no room" });
    room.step2.set(userId, card);
    if (room.step2.size === room.members.size) {
      // 결과 계산
      const entries = Array.from(room.step2.entries());
      const sorted = entries.sort((a, b) => a[1] - b[1]);
      const winnerId = sorted[0][0];
      // 점수 부여
      entries.forEach(([uid, c]) => {
        const res = uid === winnerId ? 1 : 0;
        room.scores.set(uid, room.scores.get(uid)! + res);
      });
      io.in(roomId).emit("step2Result", {
        winnerId,
        choices: Object.fromEntries(entries),
        scores: Object.fromEntries(room.scores),
      });
      // 초기화
      room.step1.clear();
      room.step2.clear();
    }
    cb({ ok: true });
  });

  socket.on("disconnect", () => console.log(`[${socket.id}] disconnected`));
});

server.listen(3000, () => console.log("Server @ http://localhost:3000"));
