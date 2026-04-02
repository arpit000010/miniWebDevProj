import { refreshToken } from "./api.js";
import { setToken, clearToken } from "./auth.js";

export const withRefresh = async (apiCall) => {
  try {
    let response = await apiCall();

    // if 401 — try refreshing token silently
    if (response.status === 401) {
      const refreshResponse = await refreshToken();

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setToken(data.accessToken); // store new token
        response = await apiCall(); // retry original call
      } else {
        // refresh failed — session truly expired
        clearToken();
        window.location.href = "/login.html";
        return;
      }
    }

    return response;
  } catch (error) {
    console.error("Request failed:", error);
  }
};

// call this on every protected page load
// silently restores session after page refresh
export const initAuth = async () => {
  const refreshResponse = await refreshToken();

  if (refreshResponse.ok) {
    const data = await refreshResponse.json();
    setToken(data.accessToken);
    return true; // logged in
  } else {
    return false; // not logged in
  }
};
