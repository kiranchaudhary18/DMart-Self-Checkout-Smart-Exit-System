import { AuthTokens } from "@/types/auth";

const ACCESS_TOKEN_KEY = "dmart_access_token";
const REFRESH_TOKEN_KEY = "dmart_refresh_token";

/**
 * Persist tokens securely (currently using localStorage, could be shifted to cookies if SSR is needed)
 */
export const setTokens = (tokens: AuthTokens) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
};

export const removeTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const hasValidAuth = (): boolean => {
  return !!getAccessToken();
};
