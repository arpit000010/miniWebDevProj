import { getToken } from "./auth.js";

const BASE_URL = "/api/auth";

// base fetch wrapper - adds token header automatically
const request = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // include cookies for refresh token
    });

    return response;
  } catch (error) {
    console.error("API request error:", error);
    return undefined;
  }
};

const registerUser = (email, password) => {
  return request("/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

const loginUser = (email, password) => {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

const getProfile = () => {
  return request("/profile");
};

const refreshToken = () => {
  return request("/refresh-token", {
    method: "POST",
  });
};

const logoutUser = () => {
  return request("/logout", {
    method: "POST",
  });
};

export { registerUser, loginUser, getProfile, refreshToken, logoutUser };
