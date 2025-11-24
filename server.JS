// server.js
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "super-secret-change-this";

// ====== 假数据（你之后换成 MongoDB） ======
const users = [];       // { id, username, passwordHash, nickname, gold }
const inventories = {}; // userId -> [{ itemKey, quantity }]
const trades = [];      // { id, sellerId, itemKey, quantity, pricePerUnit, status }

// 简单自增 ID
let userIdCounter = 1;
let tradeIdCounter = 1;

// ====== 中间件：解析 JWT ======
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ====== 注册 ======
app.post("/api/auth/register", async (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "username already exists" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: userIdCounter++,
    username,
    passwordHash,
    nickname: nickname || username,
    gold: 1000
  };
  users.push(user);
  inventories[user.id] = [{ itemKey: "apple", quantity: 10 }];
  return res.json({ success: true });
});

// ====== 登录 ======
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: "user not found" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "wrong password" });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({
    token,
    user: { id: user.id, nickname: user.nickname, gold: user.gold }
  });
});

// ====== 获取当前用户信息 ======
app.get("/api/me", authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  res.json({ id: user.id, nickname: user.nickname, gold: user.gold });
});

// ====== 获取背包 ======
app.get("/api/inventory", authMiddleware, (req, res) => {
  const items = inventories[req.user.userId] || [];
  res.json(items);
});

// ====== 发布交易订单 ======
app.post("/api/trades", authMiddleware, (req, res) => {
  const { itemKey, quantity, pricePerUnit } = req.body;
  if (!itemKey || quantity <= 0 || pricePerUnit <= 0) {
    return res.status(400).json({ error: "bad params" });
  }

  const inv = inventories[req.user.userId] || [];
  const entry = inv.find(i => i.itemKey === itemKey);
  if (!entry || entry.quantity < quantity) {
    return res.status(400).json({ error: "not enough items" });
  }
  entry.quantity -= quantity;

  const trade = {
    id: tradeIdCounter++,
    sellerId: req.user.userId,
    itemKey,
    quantity,
    pricePerUnit,
    status: "open"
  };
  trades.push(trade);
  res.json(trade);
});

// ====== 获取当前所有挂单 ======
app.get("/api/trades", (req, res) => {
  res.json(trades.filter(t => t.status === "open"));
});

// ====== 购买某个订单 ======
app.post("/api/trades/:id/buy", authMiddleware, (req, res) => {
  const trade = trades.find(t => t.id === Number(req.params.id));
  if (!trade || trade.status !== "open") {
    return res.status(400).json({ error: "trade not available" });
  }

  const buyer = users.find(u => u.id === req.user.userId);
  const seller = users.find(u => u.id === trade.sellerId);
  const totalCost = trade.quantity * trade.pricePerUnit;

  if (buyer.gold < totalCost) {
    return res.status(400).json({ error: "not enough gold" });
  }

  buyer.gold -= totalCost;
  seller.gold += totalCost;

  // 给买家物品
  const inv = inventories[buyer.id] || (inventories[buyer.id] = []);
  let entry = inv.find(i => i.itemKey === trade.itemKey);
  if (!entry) {
    entry = { itemKey: trade.itemKey, quantity: 0 };
    inv.push(entry);
  }
  entry.quantity += trade.quantity;

  trade.status = "done";
  res.json({ success: true });
});

// ====== 启动服务 ======
const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
