const PASSWORD_PREFIX = "lpqd:room-password:";

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function setRoomPassword(roomId: string, password: string): void {
  const storage = getStorage();
  if (!storage) return;
  if (!password) return;
  storage.setItem(`${PASSWORD_PREFIX}${roomId}`, password);
}

export function getRoomPassword(roomId: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(`${PASSWORD_PREFIX}${roomId}`);
}

