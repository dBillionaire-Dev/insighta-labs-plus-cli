import axios, { AxiosInstance, AxiosError } from "axios";
import { loadCredentials, saveCredentials, clearCredentials } from "./credentials";
import chalk from "chalk";

const API_URL: string = process.env.INSIGHTA_API_URL || "http://localhost:3000";

// ── Create axios instance ──
export function createApiClient(): AxiosInstance {
    const client = axios.create({
        baseURL: API_URL,
        headers: {
            "Content-Type": "application/json",
            "X-API-Version": "1",
        },
    });

    // Attach access token to every request
    client.interceptors.request.use((config) => {
        const creds = loadCredentials();
        if (creds?.access_token) {
            config.headers.Authorization = `Bearer ${creds.access_token}`;
        }
        return config;
    });

    // Auto-refresh on 401
    client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as any;

            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                const creds = loadCredentials();
                if (!creds?.refresh_token) {
                    clearCredentials();
                    console.error(chalk.red("\nSession expired. Please run: insighta login"));
                    process.exit(1);
                }

                try {
                    const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
                        refresh_token: creds.refresh_token,
                    });

                    const { access_token, refresh_token } = refreshRes.data;

                    // Save new tokens
                    saveCredentials({
                        ...creds,
                        access_token,
                        refresh_token,
                    });

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return client(originalRequest);
                } catch {
                    clearCredentials();
                    console.error(chalk.red("\nSession expired. Please run: insighta login"));
                    process.exit(1);
                }
            }

            return Promise.reject(error);
        }
    );

    return client;
}

export const api = createApiClient();