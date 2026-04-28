import fs from "fs";
import path from "path";
import os from "os";

const CREDENTIALS_DIR = path.join(os.homedir(), ".insighta");
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, "credentials.json");

export interface Credentials {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        username: string;
        email: string | null;
        role: string;
        avatar_url: string | null;
    };
}

export function saveCredentials(creds: Credentials): void {
    if (!fs.existsSync(CREDENTIALS_DIR)) {
        fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
    }
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
}

export function loadCredentials(): Credentials | null {
    if (!fs.existsSync(CREDENTIALS_FILE)) return null;
    try {
        const raw = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
        return JSON.parse(raw) as Credentials;
    } catch {
        return null;
    }
}

export function clearCredentials(): void {
    if (fs.existsSync(CREDENTIALS_FILE)) {
        fs.unlinkSync(CREDENTIALS_FILE);
    }
}

export function isLoggedIn(): boolean {
    return loadCredentials() !== null;
}