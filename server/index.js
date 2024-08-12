import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import User from "./models/User.js";
import Message from "./models/messages.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import * as ws from "ws";
import * as fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname +'/uploads'))

app.use(
  cors({
    origin: "https://chat-app-mern-frontend-gt8r.onrender.com",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

async function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, (err, userData) => {
      if (err) {
        console.error("JWT verification error:", err);
        return res.status(403).json({ error: "Token verification failed" });
      }
     
      res.json({ id: userData.userId, username: userData.username });
    });
  } else {
    res.status(401).json({ error: "No token provided" });
  }
});

app.get("/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await getUserDataFromReq(req);
    const myId = userData.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: myId },
        { sender: myId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/people", async (req, res) => {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const hashPw = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashPw,
    });

    jwt.sign({ userId: createdUser._id }, jwtSecret, (err, token) => {
      if (err) {
        console.error("JWT signing error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      res
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        })
        .status(201)
        .json({ id: createdUser._id });
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const foundUser = await User.findOne({ username });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (!passOk) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    jwt.sign(
      { userId: foundUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) {
          console.error("JWT signing error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        res
          .cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
          })
          .json({ id: foundUser._id });
      }
    );
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .json("ok");
});

const port = process.env.PORT || 5000

const server = app.listen(port, () => {
  console.log("Server is running");
});

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  console.log("New WebSocket connection");

  const cookie = req.headers.cookie;
  if (cookie) {
    const tokenCoStr = cookie.split(";").find((s) => s.startsWith("token="));
    if (tokenCoStr) {
      const token = tokenCoStr.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (e, data) => {
          if (e) {
            console.error("JWT verification failed:", e);
            return;
          }
          const { userId, username } = data;
          conn.userId = userId;
          conn.username = username;
          notifyAllClients();
        });
      }
    }
  }

  conn.on("message", async (msg) => {
    const msgData = JSON.parse(msg.toString());

    const { receiver, text, file } = msgData;
    let filename = null
    
    if (file) {
      const parts = file.name.split(".");
      const ext = parts[parts.length - 1];
       filename = Date.now() + "." + ext;
      const filePath = path.join(__dirname, "/uploads/", filename);
      const bufferData = Buffer.from(file.data, "base64");
      fs.writeFile(filePath, bufferData, () => {
        console.log("File saved" + filePath);
      });
    }
    if (receiver && (text || file)) {
      const msgDoc = await Message.create({
        sender: conn.userId,
        receiver,
        text,
        file:file? filename : null,
      });

      [...wss.clients]
        .filter((c) => c.userId === receiver)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: conn.userId,
              receiver,
              id: msgDoc._id,
              file: file ? filename : null,
            })
          )
        );
    }
  });

  conn.on("close", () => {
    console.log("WebSocket connection closed");
    notifyAllClients();
  });
});

function notifyAllClients() {
  [...wss.clients].forEach((c) => {
    c.send(
      JSON.stringify({
        online: [...wss.clients]
          .filter((cl) => cl.userId && cl.username) // Filter out connections without user info
          .map((cl) => ({
            userId: cl.userId,
            username: cl.username,
          })),
      })
    );
  });
}
