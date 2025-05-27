import { login, register, logout } from "./api";

export function saveTokens({ access, refresh }) {
  if (access && refresh) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    console.log("Tokens saved:", {
      access: access.substring(0, 10) + "...",
      refresh: refresh.substring(0, 10) + "...",
    });
  } else {
    console.error("Invalid tokens received:", { access, refresh });
  }
};

export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

export function removeTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
      console.log('Logout successful');
    }
    removeTokens();
  } catch (error) {
    const errorData = error.response?.data || { message: "Ошибка выхода" };
    throw new Error(errorData.message || JSON.stringify(errorData));
  }
}
