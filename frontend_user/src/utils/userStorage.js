export const CURRENT_USER_KEY = "smartCommunityUser";
export const REGISTERED_USERS_KEY = "smartCommunityUsers";

export const createUserId = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const loadRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) return JSON.parse(raw);

    const currentUserRaw = localStorage.getItem(CURRENT_USER_KEY);
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    if (!currentUser?.email) return [];

    const migratedUser = {
      ...currentUser,
      id: currentUser.id || createUserId(currentUser.email || currentUser.fullName),
    };
    saveRegisteredUsers([migratedUser]);
    return [migratedUser];
  } catch {
    return [];
  }
};

export const saveRegisteredUsers = (users) => {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
};

export const upsertRegisteredUser = (user) => {
  const users = loadRegisteredUsers();
  const userId = user.id || createUserId(user.email || user.fullName);
  const nextUser = { ...user, id: userId };
  const nextUsers = users.some((item) => item.id === userId || item.email === user.email)
    ? users.map((item) =>
        item.id === userId || item.email === user.email ? { ...item, ...nextUser } : item,
      )
    : [nextUser, ...users];

  saveRegisteredUsers(nextUsers);
  return nextUser;
};

export const removeRegisteredUser = (user) => {
  const userId = user?.id || createUserId(user?.email || user?.fullName || "");
  const nextUsers = loadRegisteredUsers().filter(
    (item) => item.id !== userId && item.email !== user?.email,
  );
  saveRegisteredUsers(nextUsers);
};
