import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server);
const allusers = {};

// System path setup
const __dirname = dirname(fileURLToPath(import.meta.url));

// Exposing the public directory
app.use(express.static("public"));

// Serve the sign-in page
app.get("/", (req, res) => {
    console.log("GET Request /");
    res.sendFile(join(__dirname, "/app/sign.html"));
});

// Serve the index page
app.get("/index", (req, res) => {
    console.log("GET Request /index");
    res.sendFile(join(__dirname, "/app/index.html"));
});

// Handle socket connections
io.on("connection", (socket) => {
    console.log(`Someone connected to the socket server. Socket ID: ${socket.id}`);
    socket.on("join-user", username => {
        console.log(`${username} joined the socket connection`);
        allusers[username] = { username, id: socket.id };
        io.emit("joined", allusers); // Notify others
    });

    socket.on("offer", ({ from, to, offer }) => {
        io.to(allusers[to].id).emit("offer", { from, to, offer });
    });

    socket.on("answer", ({ from, to, answer }) => {
        io.to(allusers[from].id).emit("answer", { from, to, answer });
    });

    socket.on("end-call", ({ from, to }) => {
        io.to(allusers[to].id).emit("end-call", { from, to });
    });

    socket.on("call-ended", caller => {
        const [from, to] = caller;
        io.to(allusers[from].id).emit("call-ended", caller);
        io.to(allusers[to].id).emit("call-ended", caller);
    });

    socket.on("icecandidate", candidate => {
        socket.broadcast.emit("icecandidate", candidate); // Broadcast to peers
    });
});

// Start the server
server.listen(9000, () => {
    console.log(`Server listening on port 9000`);
});
