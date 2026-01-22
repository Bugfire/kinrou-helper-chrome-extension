// Kinrou Helper - Password Manager (Session Storage)

class PasswordManager {
  static async get(): Promise<string | null> {
    if (!isExtensionContextValid()) {
      return null;
    }
    try {
      const result = await chrome.storage.session.get(PASSWORD_KEY);
      return (result[PASSWORD_KEY] as string) || null;
    } catch {
      return null;
    }
  }

  static async set(password: string): Promise<void> {
    if (!isExtensionContextValid()) {
      return;
    }
    try {
      await chrome.storage.session.set({ [PASSWORD_KEY]: password });
    } catch {
      // Extension context invalidated
    }
  }

  static async clear(): Promise<void> {
    if (!isExtensionContextValid()) {
      return;
    }
    try {
      await chrome.storage.session.set({ [PASSWORD_KEY]: null });
    } catch {
      // Extension context invalidated
    }
  }

  static async isSet(): Promise<boolean> {
    const password = await this.get();
    return password !== null && password !== '';
  }
}
