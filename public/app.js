const state = {
  token: localStorage.getItem("taskflow_token") || "",
  user: null,
  activeBoardId: localStorage.getItem("taskflow_board") || "",
  boards: [],
  board: null,
  cards: [],
  users: [],
  activity: [],
  socket: null
};

const $ = (selector) => document.querySelector(selector);
let draggedCardId = "";

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.remove("hidden");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => node.classList.add("hidden"), 3200);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

function showApp() {
  $("#authView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#currentUser").textContent = `${state.user.name} - ${state.user.role}`;
  $("#adminPanel").classList.toggle("hidden", state.user.role !== "admin");
}

function showAuth() {
  $("#authView").classList.remove("hidden");
  $("#appView").classList.add("hidden");
  if (state.socket) state.socket.close();
}

async function loadWorkspace(boardId = state.activeBoardId) {
  const data = await api("/api/boards");
  applyWorkspace(data, boardId || data.boards[0]?.id);
}

function applyWorkspace(data, preferredBoardId = state.activeBoardId) {
  state.boards = data.boards || [];
  state.users = data.users || [];
  state.activity = data.activity || [];
  const selectedBoard = state.boards.find((board) => board.id === preferredBoardId) || state.boards[0];
  state.activeBoardId = selectedBoard?.id || "";
  localStorage.setItem("taskflow_board", state.activeBoardId);
  state.board = selectedBoard || null;
  state.cards = (data.cards || []).filter((card) => card.boardId === state.activeBoardId);
  render();
}

function connectSocket() {
  if (state.socket) state.socket.close();
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${location.host}?token=${encodeURIComponent(state.token)}`);
  state.socket = socket;
  socket.addEventListener("open", () => {
    $("#socketStatus").textContent = "Live";
    $("#socketStatus").classList.add("online");
  });
  socket.addEventListener("close", () => {
    $("#socketStatus").textContent = "Offline";
    $("#socketStatus").classList.remove("online");
    if (state.user) setTimeout(connectSocket, 1500);
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "workspace:changed") applyWorkspace(message.payload);
  });
}

function render() {
  renderBoards();
  renderAssignees();
  renderUsers();
  renderBoard();
  renderActivity();
}

function renderBoards() {
  $("#boardList").innerHTML = state.boards.map((board) => `
    <div class="board-row ${board.id === state.activeBoardId ? "active" : ""}">
      <button type="button" data-open-board="${board.id}" class="board-open">${escapeHtml(board.title)}</button>
      ${(state.user?.role === "admin" || board.createdBy === state.user?.id) && state.boards.length > 1 ? `<button type="button" data-delete-board="${board.id}" class="icon-danger">Delete</button>` : ""}
    </div>
  `).join("");
}

function renderAssignees() {
  const select = $("#cardAssignee");
  const previous = select.value;
  select.innerHTML = state.users.map((user) => `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.role)})</option>`).join("");
  select.value = previous || state.user?.id || state.users[0]?.id || "";
}

function renderUsers() {
  const list = $("#userList");
  list.innerHTML = state.users.map((user) => `
    <div class="user-row">
      <div>
        <strong>${escapeHtml(user.name)}</strong>
        <span>${escapeHtml(user.username)} - ${escapeHtml(user.role)}</span>
      </div>
      <div class="user-actions">
        <button data-edit-user="${user.id}" type="button" class="ghost">Edit</button>
        ${state.user?.role === "admin" && user.id !== state.user.id ? `<button data-delete-user="${user.id}" type="button" class="icon-danger">Delete</button>` : ""}
      </div>
    </div>
  `).join("");
}

function renderBoard() {
  if (!state.board) return;
  $("#activeBoardTitle").textContent = state.board.title;
  const filteredCards = getFilteredCards();
  const doneColumn = state.board.columns.find((column) => column.title === "Done");
  const doneCount = state.cards.filter((card) => card.columnId === doneColumn?.id).length;
  $("#statsLine").textContent = `${state.cards.length} cards | ${doneCount} done | ${state.users.length} users`;
  $("#board").innerHTML = state.board.columns.map((column) => {
    const cards = column.cardIds.map((cardId) => filteredCards.find((card) => card.id === cardId)).filter(Boolean);
    return `
      <article class="column">
        <div class="column-header">
          <h2>${escapeHtml(column.title)}</h2>
          <span class="count">${cards.length}</span>
        </div>
        <div class="card-list" data-column-id="${column.id}">
          ${cards.map(renderCard).join("") || `<p class="empty-state">Drop cards here</p>`}
        </div>
      </article>
    `;
  }).join("");
}

function getFilteredCards() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const priority = $("#priorityFilter").value;
  return state.cards.filter((card) => {
    const matchesText = !query || `${card.title} ${card.description}`.toLowerCase().includes(query);
    const matchesPriority = priority === "all" || card.priority === priority;
    return matchesText && matchesPriority;
  });
}

function renderCard(card) {
  const assignee = state.users.find((user) => user.id === card.assigneeId);
  const owner = state.users.find((user) => user.id === card.createdBy);
  const canEdit = state.user?.role === "admin" || card.createdBy === state.user?.id || card.assigneeId === state.user?.id;
  const priorityClass = card.priority.toLowerCase();
  return `
    <article class="task-card ${canEdit ? "" : "locked"}" draggable="${canEdit}" data-card-id="${card.id}" title="${canEdit ? "Drag to move this card" : "Only admins, owners, or assignees can move this card"}">
      <h3>${escapeHtml(card.title)}</h3>
      ${card.description ? `<p>${escapeHtml(card.description)}</p>` : ""}
      <div class="card-meta">
        <span class="tag ${priorityClass}">${escapeHtml(card.priority)}</span>
        <span class="tag">Assignee: ${escapeHtml(assignee?.name || "Unassigned")}</span>
        <span class="tag">Owner: ${escapeHtml(owner?.name || "Unknown")}</span>
        ${card.dueDate ? `<span class="tag">Due ${escapeHtml(card.dueDate)}</span>` : ""}
      </div>
      ${canEdit ? `
        <div class="card-actions">
          <button type="button" data-edit-card="${card.id}" class="ghost">Edit</button>
          <button type="button" data-delete-card="${card.id}" class="delete">Delete</button>
        </div>
      ` : `<p class="permission-note">View only: member can edit own or assigned cards.</p>`}
    </article>
  `;
}

function renderActivity() {
  $("#activityList").innerHTML = state.activity.map((item) => `
    <div class="activity-row">
      <strong>${escapeHtml(new Date(item.createdAt).toLocaleString())}</strong>
      <span>${escapeHtml(item.text)}</span>
    </div>
  `).join("") || `<p class="empty-state">No activity yet.</p>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function resetCardForm() {
  $("#cardId").value = "";
  $("#cardForm").reset();
  $("#cardAssignee").value = state.user?.id || state.users[0]?.id || "";
  $("#cardPriority").value = "Medium";
  $("#cardFormTitle").textContent = "New Card";
}

function editCard(cardId) {
  const card = state.cards.find((item) => item.id === cardId);
  if (!card) return;
  $("#cardId").value = card.id;
  $("#cardTitle").value = card.title;
  $("#cardDescription").value = card.description;
  $("#cardAssignee").value = card.assigneeId;
  $("#cardDueDate").value = card.dueDate;
  $("#cardPriority").value = card.priority;
  $("#cardFormTitle").textContent = "Edit Card";
}

function resetUserForm() {
  $("#editUserId").value = "";
  $("#userForm").reset();
  $("#newUsername").disabled = false;
  $("#newUserPassword").value = "User@123";
}

function editUser(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;
  $("#editUserId").value = user.id;
  $("#newUserName").value = user.name;
  $("#newUsername").value = user.username;
  $("#newUsername").disabled = true;
  $("#newUserPassword").value = "";
  $("#newUserRole").value = user.role;
}

async function boot() {
  document.body.classList.toggle("dark", localStorage.getItem("taskflow_theme") === "dark");
  if (!state.token) return showAuth();
  try {
    const data = await api("/api/me");
    state.user = data.user;
    showApp();
    await loadWorkspace();
    connectSocket();
  } catch {
    localStorage.removeItem("taskflow_token");
    state.token = "";
    showAuth();
  }
}

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: $("#loginUsername").value, password: $("#loginPassword").value })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("taskflow_token", data.token);
    showApp();
    await loadWorkspace();
    connectSocket();
  } catch (error) {
    toast(error.message);
  }
});

$("#registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({ name: $("#registerName").value, username: $("#registerUsername").value, password: $("#registerPassword").value })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("taskflow_token", data.token);
    showApp();
    await loadWorkspace();
    connectSocket();
  } catch (error) {
    toast(error.message);
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" }).catch(() => {});
  localStorage.removeItem("taskflow_token");
  state.token = "";
  state.user = null;
  showAuth();
});

$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("taskflow_theme", document.body.classList.contains("dark") ? "dark" : "light");
});

$("#boardForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/api/boards", { method: "POST", body: JSON.stringify({ title: $("#boardTitle").value }) });
    $("#boardTitle").value = "";
    applyWorkspace(data, data.board.id);
    toast("Board created.");
  } catch (error) {
    toast(error.message);
  }
});

$("#cardForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const cardId = $("#cardId").value;
  const payload = {
    title: $("#cardTitle").value,
    description: $("#cardDescription").value,
    assigneeId: $("#cardAssignee").value,
    dueDate: $("#cardDueDate").value,
    priority: $("#cardPriority").value,
    columnId: state.board.columns[0].id
  };
  try {
    if (cardId) {
      await api(`/api/cards/${cardId}`, { method: "PUT", body: JSON.stringify(payload) });
      toast("Card updated.");
    } else {
      await api(`/api/boards/${state.activeBoardId}/cards`, { method: "POST", body: JSON.stringify(payload) });
      toast("Card created.");
    }
    resetCardForm();
  } catch (error) {
    toast(error.message);
  }
});

$("#resetCardForm").addEventListener("click", resetCardForm);
$("#resetUserForm").addEventListener("click", resetUserForm);
$("#searchInput").addEventListener("input", renderBoard);
$("#priorityFilter").addEventListener("change", renderBoard);

$("#userForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const editUserId = $("#editUserId").value;
  const payload = {
    name: $("#newUserName").value,
    username: $("#newUsername").value,
    password: $("#newUserPassword").value,
    role: $("#newUserRole").value
  };
  try {
    if (editUserId) {
      await api(`/api/users/${editUserId}`, { method: "PUT", body: JSON.stringify(payload) });
      toast("User updated.");
    } else {
      await api("/api/users", { method: "POST", body: JSON.stringify(payload) });
      toast("User added.");
    }
    resetUserForm();
  } catch (error) {
    toast(error.message);
  }
});

document.addEventListener("click", async (event) => {
  const openBoardButton = event.target.closest("[data-open-board]");
  const deleteBoardButton = event.target.closest("[data-delete-board]");
  const editButton = event.target.closest("[data-edit-card]");
  const deleteButton = event.target.closest("[data-delete-card]");
  const editUserButton = event.target.closest("[data-edit-user]");
  const deleteUserButton = event.target.closest("[data-delete-user]");

  if (openBoardButton) {
    state.activeBoardId = openBoardButton.dataset.openBoard;
    localStorage.setItem("taskflow_board", state.activeBoardId);
    state.board = state.boards.find((board) => board.id === state.activeBoardId);
    state.cards = state.cards.filter((card) => card.boardId === state.activeBoardId);
    await loadWorkspace(state.activeBoardId);
  }

  if (deleteBoardButton) {
    try {
      const data = await api(`/api/boards/${deleteBoardButton.dataset.deleteBoard}`, { method: "DELETE" });
      applyWorkspace(data);
      toast("Board deleted.");
    } catch (error) {
      toast(error.message);
    }
  }

  if (editButton) editCard(editButton.dataset.editCard);

  if (deleteButton) {
    try {
      await api(`/api/cards/${deleteButton.dataset.deleteCard}`, { method: "DELETE" });
      toast("Card deleted.");
    } catch (error) {
      toast(error.message);
    }
  }

  if (editUserButton) editUser(editUserButton.dataset.editUser);

  if (deleteUserButton) {
    try {
      await api(`/api/users/${deleteUserButton.dataset.deleteUser}`, { method: "DELETE" });
      toast("User removed.");
    } catch (error) {
      toast(error.message);
    }
  }
});

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest(".task-card");
  if (!card || card.getAttribute("draggable") !== "true") return;
  draggedCardId = card.dataset.cardId;
  card.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-taskflow-card", draggedCardId);
  event.dataTransfer.setData("text/plain", draggedCardId);
});

document.addEventListener("dragend", () => {
  draggedCardId = "";
  document.querySelectorAll(".task-card.dragging, .card-list.drag-over").forEach((node) => {
    node.classList.remove("dragging", "drag-over");
  });
});

document.addEventListener("dragover", (event) => {
  const list = event.target.closest(".card-list");
  if (!list || !draggedCardId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  list.classList.add("drag-over");
});

document.addEventListener("dragleave", (event) => {
  const list = event.target.closest(".card-list");
  if (!list || list.contains(event.relatedTarget)) return;
  list.classList.remove("drag-over");
});

document.addEventListener("drop", async (event) => {
  const list = event.target.closest(".card-list");
  if (!list) return;
  event.preventDefault();
  list.classList.remove("drag-over");
  const cardId = event.dataTransfer.getData("application/x-taskflow-card") || event.dataTransfer.getData("text/plain") || draggedCardId;
  if (!cardId) return;
  const siblings = [...list.querySelectorAll(".task-card")].filter((card) => card.dataset.cardId !== cardId);
  const index = siblings.findIndex((card) => event.clientY < card.getBoundingClientRect().top + card.offsetHeight / 2);
  try {
    await api("/api/cards/move", {
      method: "POST",
      body: JSON.stringify({ cardId, columnId: list.dataset.columnId, index: index === -1 ? siblings.length : index })
    });
  } catch (error) {
    toast(error.message);
  }
});

boot();
