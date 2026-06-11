const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-before-production";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function now() {
  return new Date().toISOString();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, originalHash] = stored.split(":");
  const candidate = hashPassword(password, salt).split(":")[1];
  if (candidate.length !== originalHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(originalHash, "hex"));
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signToken(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 }));
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function makeColumns(boardKey) {
  return [
    { id: `col_${boardKey}_todo`, title: "To Do", cardIds: [] },
    { id: `col_${boardKey}_doing`, title: "In Progress", cardIds: [] },
    { id: `col_${boardKey}_done`, title: "Done", cardIds: [] }
  ];
}

function seedProjects(adminId, memberId) {
  return [
    {
      key: "sprint",
      title: "Website Redesign",
      createdBy: adminId,
      cards: [
        { id: "card_plan", column: "todo", title: "Finalize sprint goals", description: "Agree on this week's most important outcomes.", assigneeId: memberId, priority: "High", createdBy: adminId },
        { id: "card_copy", column: "todo", title: "Write onboarding checklist", description: "Keep it short enough for a new teammate to finish quickly.", assigneeId: memberId, priority: "Medium", createdBy: memberId },
        { id: "card_api", column: "doing", title: "Review API errors", description: "Check recent auth failures and document the fix.", assigneeId: adminId, priority: "High", createdBy: adminId },
        { id: "card_setup", column: "done", title: "Create project board", description: "Seed default columns and invite the first users.", assigneeId: adminId, priority: "Low", createdBy: adminId }
      ]
    },
    {
      key: "marketing",
      title: "Marketing Team",
      createdBy: adminId,
      cards: [
        { id: "card_campaign", column: "todo", title: "Plan launch campaign", description: "Prepare campaign goals, target audience, and launch checklist.", assigneeId: adminId, priority: "High", createdBy: adminId },
        { id: "card_social", column: "doing", title: "Schedule social posts", description: "Create one week of posts for LinkedIn, Instagram, and X.", assigneeId: memberId, priority: "Medium", createdBy: adminId },
        { id: "card_brand", column: "done", title: "Collect brand assets", description: "Upload logo, color palette, and approved product screenshots.", assigneeId: memberId, priority: "Low", createdBy: memberId }
      ]
    },
    {
      key: "mobile",
      title: "Mobile App",
      createdBy: memberId,
      cards: [
        { id: "card_wireframes", column: "todo", title: "Design onboarding wireframes", description: "Create simple mobile onboarding screens before implementation.", assigneeId: memberId, priority: "High", createdBy: memberId },
        { id: "card_push", column: "doing", title: "Build push notification settings", description: "Allow users to enable or disable reminder notifications.", assigneeId: adminId, priority: "Medium", createdBy: adminId },
        { id: "card_release", column: "done", title: "Prepare beta release notes", description: "Write a short release summary for internal testers.", assigneeId: memberId, priority: "Low", createdBy: memberId }
      ]
    },
    {
      key: "roadmap",
      title: "Product Roadmap",
      createdBy: adminId,
      cards: [
        { id: "card_research", column: "todo", title: "Interview power users", description: "Collect feature requests from five active users.", assigneeId: memberId, priority: "High", createdBy: adminId },
        { id: "card_specs", column: "doing", title: "Draft roadmap specs", description: "Turn research notes into quarterly product themes.", assigneeId: adminId, priority: "Medium", createdBy: adminId },
        { id: "card_votes", column: "done", title: "Prioritize feature votes", description: "Rank ideas by user impact and implementation effort.", assigneeId: memberId, priority: "Low", createdBy: memberId }
      ]
    },
    {
      key: "support",
      title: "Customer Support",
      createdBy: adminId,
      cards: [
        { id: "card_triage", column: "todo", title: "Triage open tickets", description: "Sort new support tickets by severity and owner.", assigneeId: memberId, priority: "High", createdBy: adminId },
        { id: "card_kb", column: "doing", title: "Update help center article", description: "Refresh the setup guide with the latest screenshots.", assigneeId: memberId, priority: "Medium", createdBy: memberId },
        { id: "card_feedback", column: "done", title: "Summarize feedback themes", description: "Share weekly customer feedback highlights with the team.", assigneeId: adminId, priority: "Low", createdBy: adminId }
      ]
    },
    {
      key: "sales",
      title: "Sales Pipeline",
      createdBy: adminId,
      cards: [
        { id: "card_leads", column: "todo", title: "Qualify inbound leads", description: "Review demo requests and assign next steps.", assigneeId: adminId, priority: "High", createdBy: adminId },
        { id: "card_proposals", column: "doing", title: "Prepare pricing proposals", description: "Create tailored proposals for shortlisted accounts.", assigneeId: memberId, priority: "Medium", createdBy: adminId },
        { id: "card_followups", column: "done", title: "Send follow-up emails", description: "Confirm action items after completed discovery calls.", assigneeId: memberId, priority: "Low", createdBy: memberId }
      ]
    },
    {
      key: "content",
      title: "Content Calendar",
      createdBy: memberId,
      cards: [
        { id: "card_topics", column: "todo", title: "Pick blog topics", description: "Choose three article ideas for the next content sprint.", assigneeId: memberId, priority: "Medium", createdBy: memberId },
        { id: "card_draft", column: "doing", title: "Draft launch blog", description: "Write the first version of the launch announcement.", assigneeId: adminId, priority: "High", createdBy: adminId },
        { id: "card_publish", column: "done", title: "Publish newsletter", description: "Send this week's update to the subscriber list.", assigneeId: memberId, priority: "Low", createdBy: memberId }
      ]
    },
    {
      key: "qa",
      title: "QA Testing",
      createdBy: adminId,
      cards: [
        { id: "card_regression", column: "todo", title: "Run regression checklist", description: "Validate login, board creation, card editing, and drag/drop.", assigneeId: memberId, priority: "High", createdBy: adminId },
        { id: "card_bugs", column: "doing", title: "Verify bug fixes", description: "Retest recently fixed issues before release.", assigneeId: adminId, priority: "Medium", createdBy: adminId },
        { id: "card_signoff", column: "done", title: "Complete release sign-off", description: "Confirm the demo build is ready for review.", assigneeId: memberId, priority: "Low", createdBy: memberId }
      ]
    },
    {
      key: "devops",
      title: "DevOps Automation",
      createdBy: adminId,
      cards: [
        { id: "card_env", column: "todo", title: "Document environment variables", description: "List required deployment variables and sample values.", assigneeId: adminId, priority: "Medium", createdBy: adminId },
        { id: "card_pipeline", column: "doing", title: "Check deployment pipeline", description: "Make sure the hosting start command and port are correct.", assigneeId: memberId, priority: "High", createdBy: adminId },
        { id: "card_backup", column: "done", title: "Back up demo data", description: "Keep a copy of the seeded JSON database for restore testing.", assigneeId: memberId, priority: "Low", createdBy: memberId }
      ]
    }
  ];
}

function seedCardToRecord(card, project) {
  return {
    id: card.id,
    boardId: `board_${project.key}`,
    columnId: `col_${project.key}_${card.column}`,
    title: card.title,
    description: card.description,
    assigneeId: card.assigneeId,
    dueDate: "",
    priority: card.priority,
    createdBy: card.createdBy,
    updatedAt: now()
  };
}

function seedBoardToRecord(project) {
  const board = { id: `board_${project.key}`, title: project.title, columns: makeColumns(project.key), createdBy: project.createdBy, createdAt: now() };
  for (const card of project.cards) {
    const column = board.columns.find((item) => item.id === `col_${project.key}_${card.column}`);
    column.cardIds.push(card.id);
  }
  return board;
}

function defaultData() {
  const adminId = "user_admin";
  const memberId = "user_member";
  const projects = seedProjects(adminId, memberId);
  const boards = projects.map(seedBoardToRecord);

  return {
    users: [
      { id: adminId, username: "admin", name: "Admin", role: "admin", passwordHash: hashPassword("Admin@123"), createdAt: now() },
      { id: memberId, username: "user", name: "User", role: "member", passwordHash: hashPassword("User@123"), createdAt: now() }
    ],
    boards,
    cards: projects.flatMap((project) => project.cards.map((card) => seedCardToRecord(card, project))),
    activity: [
      { id: id("act"), text: "Seeded demo users, boards, and cards.", createdAt: now() }
    ]
  };
}

function ensureSeedBoard(data, project) {
  if (data.boards.some((item) => item.id === `board_${project.key}`)) return;
  data.boards.push(seedBoardToRecord(project));
}

function ensureSeedCard(data, card) {
  if (data.cards.some((item) => item.id === card.id)) return;
  const board = data.boards.find((item) => item.id === card.boardId);
  const column = board?.columns.find((item) => item.id === card.columnId);
  if (!board || !column) return;
  data.cards.push(card);
  if (!column.cardIds.includes(card.id)) column.cardIds.push(card.id);
}

function ensureDefaultDemoData(data) {
  const adminId = data.users.find((user) => user.role === "admin")?.id || "user_admin";
  const memberId = data.users.find((user) => user.role === "member")?.id || "user_member";
  const projects = seedProjects(adminId, memberId);
  for (const project of projects) ensureSeedBoard(data, project);
  for (const project of projects) {
    for (const card of project.cards) ensureSeedCard(data, seedCardToRecord(card, project));
  }
}

function normalizeData(data) {
  if (!Array.isArray(data.boards) || data.boards.length < 2) return defaultData();
  data.activity = Array.isArray(data.activity) ? data.activity : [];
  for (const board of data.boards) {
    board.createdAt = board.createdAt || now();
    board.createdBy = board.createdBy || data.users[0]?.id || "user_admin";
  }
  ensureDefaultDemoData(data);
  return data;
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const seed = defaultData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  const loaded = normalizeData(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
  fs.writeFileSync(DATA_FILE, JSON.stringify(loaded, null, 2));
  return loaded;
}

let db = loadData();

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function publicUser(user) {
  return { id: user.id, username: user.username, name: user.name, role: user.role, createdAt: user.createdAt };
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((cookie) => {
    const [key, ...value] = cookie.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

function getCurrentUser(req) {
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const requestUrl = new URL(req.url, "http://localhost");
  const token = bearer || requestUrl.searchParams.get("token") || parseCookies(req).token;
  const payload = verifyToken(token);
  return payload ? db.users.find((user) => user.id === payload.sub) || null : null;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function addActivity(text) {
  db.activity.unshift({ id: id("act"), text, createdAt: now() });
  db.activity = db.activity.slice(0, 40);
}

function boardPayload(boardId = db.boards[0]?.id) {
  const board = db.boards.find((item) => item.id === boardId) || db.boards[0];
  return {
    board,
    boards: db.boards,
    cards: db.cards.filter((card) => card.boardId === board.id),
    users: db.users.map(publicUser),
    activity: db.activity.slice(0, 20)
  };
}

function allPayload() {
  return {
    boards: db.boards,
    cards: db.cards,
    users: db.users.map(publicUser),
    activity: db.activity.slice(0, 20)
  };
}

function canManageCard(user, card) {
  return user.role === "admin" || card.createdBy === user.id || card.assigneeId === user.id;
}

const sockets = new Set();

function encodeWsMessage(message) {
  const payload = Buffer.from(message);
  if (payload.length < 126) return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  const header = Buffer.alloc(4);
  header[0] = 0x81;
  header[1] = 126;
  header.writeUInt16BE(payload.length, 2);
  return Buffer.concat([header, payload]);
}

function broadcast(type, payload = allPayload()) {
  const message = JSON.stringify({ type, payload });
  for (const socket of sockets) socket.write(encodeWsMessage(message));
}

async function handleApi(req, res) {
  try {
    if (req.method === "POST" && req.url === "/api/register") {
      const body = await readBody(req);
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || username).trim();
      if (!username || password.length < 6) return sendJson(res, 400, { message: "Username and 6+ character password are required." });
      if (db.users.some((user) => user.username === username)) return sendJson(res, 409, { message: "Username already exists." });
      const user = { id: id("user"), username, name, role: "member", passwordHash: hashPassword(password), createdAt: now() };
      db.users.push(user);
      addActivity(`${user.name} registered as a member.`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 201, { user: publicUser(user), token: signToken({ sub: user.id, role: user.role }) });
    }

    if (req.method === "POST" && req.url === "/api/login") {
      const body = await readBody(req);
      const username = String(body.username || "").trim().toLowerCase();
      const user = db.users.find((item) => item.username === username);
      if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) return sendJson(res, 401, { message: "Invalid username or password." });
      const token = signToken({ sub: user.id, role: user.role });
      res.setHeader("Set-Cookie", `token=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);
      return sendJson(res, 200, { user: publicUser(user), token });
    }

    const currentUser = getCurrentUser(req);
    if (!currentUser) return sendJson(res, 401, { message: "Authentication required." });

    if (req.method === "POST" && req.url === "/api/logout") {
      res.setHeader("Set-Cookie", "token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
      return sendJson(res, 200, { message: "Logged out." });
    }

    if (req.method === "GET" && req.url === "/api/me") return sendJson(res, 200, { user: publicUser(currentUser) });
    if (req.method === "GET" && req.url === "/api/boards") return sendJson(res, 200, allPayload());

    const boardMatch = req.url.match(/^\/api\/boards\/([^/]+)$/);
    if (boardMatch && req.method === "GET") return sendJson(res, 200, boardPayload(boardMatch[1]));

    if (req.method === "POST" && req.url === "/api/boards") {
      const body = await readBody(req);
      const title = String(body.title || "").trim();
      if (!title) return sendJson(res, 400, { message: "Board title is required." });
      const boardKey = id("board").replace("board_", "");
      const board = { id: `board_${boardKey}`, title, columns: makeColumns(boardKey), createdBy: currentUser.id, createdAt: now() };
      db.boards.push(board);
      addActivity(`${currentUser.name} created board "${title}".`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 201, boardPayload(board.id));
    }

    if (boardMatch && req.method === "DELETE") {
      const board = db.boards.find((item) => item.id === boardMatch[1]);
      if (!board) return sendJson(res, 404, { message: "Board not found." });
      if (currentUser.role !== "admin" && board.createdBy !== currentUser.id) return sendJson(res, 403, { message: "Only admins or board owners can delete boards." });
      if (db.boards.length === 1) return sendJson(res, 400, { message: "At least one board is required." });
      db.boards = db.boards.filter((item) => item.id !== board.id);
      db.cards = db.cards.filter((card) => card.boardId !== board.id);
      addActivity(`${currentUser.name} deleted board "${board.title}".`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 200, boardPayload(db.boards[0].id));
    }

    const createCardMatch = req.url.match(/^\/api\/boards\/([^/]+)\/cards$/);
    if (createCardMatch && req.method === "POST") {
      const board = db.boards.find((item) => item.id === createCardMatch[1]);
      if (!board) return sendJson(res, 404, { message: "Board not found." });
      const body = await readBody(req);
      const column = board.columns.find((item) => item.id === body.columnId) || board.columns[0];
      const card = {
        id: id("card"),
        boardId: board.id,
        columnId: column.id,
        title: String(body.title || "Untitled card").trim(),
        description: String(body.description || "").trim(),
        assigneeId: String(body.assigneeId || currentUser.id),
        dueDate: String(body.dueDate || ""),
        priority: ["Low", "Medium", "High"].includes(body.priority) ? body.priority : "Medium",
        createdBy: currentUser.id,
        updatedAt: now()
      };
      db.cards.push(card);
      column.cardIds.push(card.id);
      addActivity(`${currentUser.name} created card "${card.title}" on "${board.title}".`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 201, { card });
    }

    const cardMatch = req.url.match(/^\/api\/cards\/([^/]+)$/);
    if (cardMatch && req.method === "PUT") {
      const card = db.cards.find((item) => item.id === cardMatch[1]);
      if (!card) return sendJson(res, 404, { message: "Card not found." });
      if (!canManageCard(currentUser, card)) return sendJson(res, 403, { message: "Members can only manage their own or assigned cards." });
      const body = await readBody(req);
      card.title = String(body.title || card.title).trim();
      card.description = String(body.description || "").trim();
      card.assigneeId = String(body.assigneeId || card.assigneeId);
      card.dueDate = String(body.dueDate || "");
      card.priority = ["Low", "Medium", "High"].includes(body.priority) ? body.priority : card.priority;
      card.updatedAt = now();
      addActivity(`${currentUser.name} updated card "${card.title}".`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 200, { card });
    }

    if (cardMatch && req.method === "DELETE") {
      const card = db.cards.find((item) => item.id === cardMatch[1]);
      if (!card) return sendJson(res, 404, { message: "Card not found." });
      if (!canManageCard(currentUser, card)) return sendJson(res, 403, { message: "Members can only manage their own or assigned cards." });
      db.cards = db.cards.filter((item) => item.id !== card.id);
      const board = db.boards.find((item) => item.id === card.boardId);
      if (board) for (const column of board.columns) column.cardIds = column.cardIds.filter((cardId) => cardId !== card.id);
      addActivity(`${currentUser.name} deleted card "${card.title}".`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 200, { message: "Card deleted." });
    }

    if (req.method === "POST" && req.url === "/api/cards/move") {
      const body = await readBody(req);
      const card = db.cards.find((item) => item.id === body.cardId);
      if (!card) return sendJson(res, 404, { message: "Card not found." });
      if (!canManageCard(currentUser, card)) return sendJson(res, 403, { message: "Members can only move their own or assigned cards." });
      const board = db.boards.find((item) => item.id === card.boardId);
      const targetColumn = board?.columns.find((item) => item.id === body.columnId);
      if (!board || !targetColumn) return sendJson(res, 404, { message: "Column not found." });
      for (const column of board.columns) column.cardIds = column.cardIds.filter((cardId) => cardId !== card.id);
      const requestedIndex = Number.isInteger(body.index) ? body.index : targetColumn.cardIds.length;
      targetColumn.cardIds.splice(Math.max(0, requestedIndex), 0, card.id);
      card.columnId = targetColumn.id;
      card.updatedAt = now();
      addActivity(`${currentUser.name} moved card "${card.title}" to ${targetColumn.title}.`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 200, boardPayload(board.id));
    }

    if (req.url === "/api/users" && req.method === "POST") {
      if (currentUser.role !== "admin") return sendJson(res, 403, { message: "Only admins can manage users." });
      const body = await readBody(req);
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "User@123");
      if (!username) return sendJson(res, 400, { message: "Username is required." });
      if (db.users.some((user) => user.username === username)) return sendJson(res, 409, { message: "Username already exists." });
      const user = { id: id("user"), username, name: String(body.name || username).trim(), role: body.role === "admin" ? "admin" : "member", passwordHash: hashPassword(password), createdAt: now() };
      db.users.push(user);
      addActivity(`${currentUser.name} added ${user.name} as ${user.role}.`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 201, { user: publicUser(user) });
    }

    const userMatch = req.url.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && req.method === "PUT") {
      if (currentUser.role !== "admin") return sendJson(res, 403, { message: "Only admins can manage users." });
      const user = db.users.find((item) => item.id === userMatch[1]);
      if (!user) return sendJson(res, 404, { message: "User not found." });
      const body = await readBody(req);
      user.name = String(body.name || user.name).trim();
      user.role = body.role === "admin" ? "admin" : "member";
      if (body.password) user.passwordHash = hashPassword(String(body.password));
      addActivity(`${currentUser.name} updated ${user.name}'s user profile.`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (userMatch && req.method === "DELETE") {
      if (currentUser.role !== "admin") return sendJson(res, 403, { message: "Only admins can manage users." });
      if (currentUser.id === userMatch[1]) return sendJson(res, 400, { message: "You cannot delete your own account." });
      const deleted = db.users.find((user) => user.id === userMatch[1]);
      db.users = db.users.filter((user) => user.id !== userMatch[1]);
      for (const card of db.cards) if (card.assigneeId === userMatch[1]) card.assigneeId = currentUser.id;
      addActivity(`${currentUser.name} deleted user ${deleted?.name || "Unknown"}.`);
      saveData();
      broadcast("workspace:changed");
      return sendJson(res, 200, { message: "User deleted." });
    }

    sendJson(res, 404, { message: "Route not found." });
  } catch (error) {
    sendJson(res, 500, { message: error.message || "Server error." });
  }
}

function serveStatic(req, res) {
  const requestedPath = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) {
          res.writeHead(404);
          return res.end("Not found");
        }
        res.writeHead(200, { "Content-Type": MIME_TYPES[".html"] });
        res.end(fallback);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

function handleUpgrade(req, socket) {
  const user = getCurrentUser(req);
  if (!user || req.headers.upgrade?.toLowerCase() !== "websocket") {
    socket.destroy();
    return;
  }
  const acceptKey = crypto.createHash("sha1").update(`${req.headers["sec-websocket-key"]}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
  socket.write(["HTTP/1.1 101 Switching Protocols", "Upgrade: websocket", "Connection: Upgrade", `Sec-WebSocket-Accept: ${acceptKey}`, "", ""].join("\r\n"));
  sockets.add(socket);
  socket.write(encodeWsMessage(JSON.stringify({ type: "workspace:changed", payload: allPayload() })));
  socket.on("close", () => sockets.delete(socket));
  socket.on("end", () => sockets.delete(socket));
  socket.on("error", () => sockets.delete(socket));
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) return handleApi(req, res);
  serveStatic(req, res);
});

server.on("upgrade", handleUpgrade);
server.listen(PORT, () => console.log(`TaskFlow running at http://localhost:${PORT}`));
