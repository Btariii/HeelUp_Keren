const STORAGE_KEY = "heelup-auth-users";

const defaultUsers = [
  {
    username: "admin",
    password: "12345",
  },
];

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function ensureSeedUsers() {
  if (typeof window === "undefined") {
    return defaultUsers;
  }

  const savedUsers = window.localStorage.getItem(STORAGE_KEY);

  if (!savedUsers) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  try {
    const parsedUsers = JSON.parse(savedUsers);

    if (Array.isArray(parsedUsers)) {
      return parsedUsers;
    }
  } catch {
    // Reset corrupted storage below.
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

export function getStoredUsers() {
  return ensureSeedUsers();
}

export function findUser(username, password) {
  const normalizedUsername = normalizeUsername(username);

  return getStoredUsers().find(
    (user) => normalizeUsername(user.username) === normalizedUsername && user.password === password,
  );
}

export function userExists(username) {
  const normalizedUsername = normalizeUsername(username);

  return getStoredUsers().some(
    (user) => normalizeUsername(user.username) === normalizedUsername,
  );
}

export function createUser({ username, password }) {
  const nextUser = {
    username: username.trim(),
    password,
  };

  const users = getStoredUsers();
  const normalizedUsername = normalizeUsername(nextUser.username);
  const hasDuplicate = users.some(
    (user) => normalizeUsername(user.username) === normalizedUsername,
  );

  if (hasDuplicate) {
    throw new Error("Username sudah digunakan");
  }

  const updatedUsers = [...users, nextUser];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));

  return nextUser;
}