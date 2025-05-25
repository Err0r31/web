import { login, register, logout } from "./api";

export function saveTokens(tokens) {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}
export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function removeTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function authRegister(
  username,
  email,
  password,
  address = "",
  phone_number = ""
) {
  try {
    const data = await register(
      username,
      email,
      password,
      address,
      phone_number
    );
    return data;
  } catch (error) {
    const errorData = error.response?.data || { message: "Ошибка регистрации" };
    throw new Error(errorData.message || JSON.stringify(errorData));
  }
}

export async function authLogin(username, password) {
  try {
    const data = await login(username, password);
    saveTokens(data);
    return data;
  } catch (error) {
    const errorData = error.response?.data || { message: "Ошибка входа" };
    throw new Error(errorData.message || JSON.stringify(errorData));
  }
}

export async function authLogout() {
  try {
    const refresh = getRefreshToken();
    if (refresh) {
      await logout(refresh);
    }
    removeTokens();
  } catch (error) {
    const errorData = error.response?.data || { message: "Ошибка выхода" };
    throw new Error(errorData.message || JSON.stringify(errorData));
  }
}
