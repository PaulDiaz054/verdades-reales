const BASE_URL = import.meta.env.VITE_SERVER_URL
  ? `${import.meta.env.VITE_SERVER_URL}/api/storage`
  : "/api/storage";

async function request(method, key, body) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(key)}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404) throw new Error("Key not found");
  if (!res.ok) throw new Error(`Storage error: ${res.statusText}`);
  return res.json();
}

const storage = {
  async get(key)         { return request("GET",    key);          },
  async set(key, value)  { return request("POST",   key, { value }); },
  async delete(key)      { return request("DELETE", key);          },
  async list(prefix = "") {
    const res = await fetch(`${BASE_URL}?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) throw new Error(`Storage error: ${res.statusText}`);
    return res.json();
  },
};

export default storage;
