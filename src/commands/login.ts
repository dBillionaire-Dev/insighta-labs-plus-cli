import http from "http";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import open from "open";
import axios from "axios";
import { generateCodeVerifier, generateCodeChallenge, generateState } from "../utils/pkce";
import { saveCredentials, isLoggedIn } from "../utils/credentials";

const API_URL: string = process.env.INSIGHTA_API_URL || "http://localhost:3000";
const CLI_CALLBACK_PORT = 9876;
const CLI_CALLBACK_URL = `http://localhost:${CLI_CALLBACK_PORT}/callback`;

export function registerLoginCommand(program: Command): void {
    program
        .command("login")
        .description("Log in with your GitHub account")
        .action(async (): Promise<void> => {
            if (isLoggedIn()) {
                console.log(chalk.yellow("You are already logged in. Run `insighta logout` first."));
                return;
            }

            const codeVerifier = generateCodeVerifier();
            const codeChallenge = generateCodeChallenge(codeVerifier);
            const state = generateState();

            // Build GitHub OAuth URL via backend
            const authUrl =
                `${API_URL}/auth/github?` +
                `code_challenge=${codeChallenge}&` +
                `code_challenge_method=S256&` +
                `state=${state}`;

            console.log(chalk.cyan("\nOpening GitHub login in your browser..."));
            console.log(chalk.gray("If the browser doesn't open, visit this URL manually:"));
            console.log(chalk.underline(authUrl));

            // Spin up a local server to catch the OAuth callback
            const server = http.createServer(async (req, res): Promise<void> => {
                if (!req.url?.startsWith("/callback")) return;

                const url = new URL(req.url, `http://localhost:${CLI_CALLBACK_PORT}`);
                const code = url.searchParams.get("code");
                const returnedState = url.searchParams.get("state");

                // Close the browser tab
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:40px">
            <h2>Login successful!</h2>
            <p>You can close this tab and return to your terminal.</p>
          </body></html>
    `);
            server.close();

            if (!code) {
                console.error(chalk.red("\n✖ OAuth callback missing code. Login failed."));
                process.exit(1);
            }

            if (returnedState !== state) {
                console.error(chalk.red("\n✖ State mismatch. Possible CSRF attack. Login aborted."));
                process.exit(1);
            }

            const spinner = ora("Exchanging code for tokens...").start();

            try {
                // Send code + code_verifier to backend callback
                const callbackUrl =
                    `${API_URL}/auth/github/callback?` +
                    `code=${code}&` +
                    `state=${state}&` +
                    `code_verifier=${codeVerifier}`;

                const tokenRes = await axios.get(callbackUrl);
                const { access_token, refresh_token, user } = tokenRes.data;

                saveCredentials({ access_token, refresh_token, user });

                spinner.succeed(chalk.green("Login successful!"));
                console.log(chalk.cyan(`\nWelcome, ${user.username}! Role: ${chalk.bold(user.role)}`));
            } catch (err: any) {
                spinner.fail("Login failed");
                console.error(chalk.red(err.response?.data?.message || err.message));
                process.exit(1);
            }
        });

        server.listen(CLI_CALLBACK_PORT, (): void => {
            open(authUrl).catch((): void => {
                console.log(chalk.yellow("Could not open browser automatically. Please visit the URL above."));
            });
        });

        // Timeout after 2 minutes
        setTimeout((): void => {
            server.close();
            console.error(chalk.red("\n✖ Login timed out after 2 minutes."));
            process.exit(1);
        }, 2 * 60 * 1000);
    });
}