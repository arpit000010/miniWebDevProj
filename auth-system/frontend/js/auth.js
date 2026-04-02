// the token lives here — in module scope
// when page refreshes, this becomes null again

let accessToken = null;

const setToken = (token) => {
  accessToken = token;
};

const getToken = () => {
  return accessToken;
};

const clearToken = () => {
  accessToken = null;
};

const isLoggedIn = () => {
  return accessToken !== null;
};

export { setToken, getToken, clearToken, isLoggedIn };
