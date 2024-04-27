const express = require("express")
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();

const route = require("./route");
const { addUser, findUser, getQuantityUsers, removeUser } = require("./users");

app.use(cors({ origin: "*" }));
app.use(route);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", method: ["GET", "POST"] } });

io.on("connection", (socket) => {
    socket.on("join", ({name, room}) => {
        socket.join(room);

        const { user, isExist } = addUser({name, room});
        const meMessage = isExist ? `С возвращением ${user.name}` : `Привет ${user.name}`;
        const userMessage = isExist ? `${user.name} вернулся` : `${user.name} подключился`;

        socket.emit("message", { data: { user: {name: "RAI.o"}, message: meMessage } });

        socket.broadcast.to(user.room).emit("message", { data: { user: {name: "RAI.o"}, message: userMessage } });

        socket.on("sendMessage", ({ message, params }) => {
            const user = findUser(params);
            if(user) { io.to(user.room).emit("message", { data: { user, message } }); }
        });

        socket.on("exitRoom", ({ params }) => {
            const user = removeUser(params);

            if(user) { 
                const { room, name } = user;

                io.to(room).emit("message", { 
                    data: { user: { name: "RAI.o" }, message: `${name} покинул канал` },
                });
                
                io.to(room).emit("room", { 
                    data: { users: getQuantityUsers(room) } 
                });
            }
        });

        io.to(user.room).emit("room", { 
            data: { users: getQuantityUsers(user.room) } 
        });
    });

    io.on("disconnect", () => { console.log("Disconnect") });
});

server.listen(5000, () => { console.log("Start server, port: 5000") });