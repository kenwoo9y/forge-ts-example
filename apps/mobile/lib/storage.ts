import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'api_token';
const USERNAME_KEY = 'username';

export const storage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getUsername(): Promise<string | null> {
    return SecureStore.getItemAsync(USERNAME_KEY);
  },
  async setUsername(username: string): Promise<void> {
    await SecureStore.setItemAsync(USERNAME_KEY, username);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USERNAME_KEY);
  },
};
