const API_URL = "http://localhost:8000/api";

export function saveTokens(tokens) {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
}

export function getAccessToken() {
  localStorage.getItem("access_token");
}
export function getRefreshToken() {
  localStorage.getItem("refresh_token");
}

export function removeTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function register(
  username,
  email,
  password,
  address,
  phone_number
) {
  const response = await fetch(`${API_URL}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, address, phone_number }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }
  return await response.json();
}

export async function login(username, password) {
  const response = await fetch(`${API_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username , password }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }
  const data = await response.json();
  saveTokens(data);
  return data;
}

export async function logout() {
  const refresh = getRefreshToken();
  await fetch(`${API_URL}/logout/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  removeTokens();
}
