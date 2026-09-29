export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  if (!stored || !token || stored === "undefined" || stored === "null") {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }

  try {
    return JSON.parse(stored) as StoredUser;
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
}