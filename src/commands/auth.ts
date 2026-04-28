import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadCredentials, clearCredentials, isLoggedIn } from "../utils/credentials";
import { api } from "../utils/api";
import { printError } from "../utils/display";

export function registerLogoutCommand(program: Command): void {
    program
        .command("logout")
        .description("Log out and clear saved credentials")
        .action(async (): Promise<void> => {
            if (!isLoggedIn()) {
                console.log(chalk.yellow("You are not logged in."));
                return;
            }

            const spinner = ora("Logging out...").start();
            try {
                const creds = loadCredentials();
                await api.post("/auth/logout", {
                    refresh_token: creds?.refresh_token,
                });
                spinner.succeed("Logged out successfully.");
            } catch {
                // Even if the API call fails, clear local credentials
                spinner.warn("Could not reach server. Clearing local credentials anyway.");
            } finally {
                clearCredentials();
            }
        });
}

export function registerWhoamiCommand(program: Command): void {
    program
        .command("whoami")
        .description("Show current logged-in user")
        .action(async (): Promise<void> => {
            if (!isLoggedIn()) {
                console.log(chalk.yellow("You are not logged in. Run: insighta login"));
                return;
            }

            const spinner = ora("Fetching user info...").start();
            try {
                const res = await api.get("/auth/me");
                const user = res.data.data;
                spinner.stop();

                console.log(chalk.cyan("\nLogged in as:"));
                console.log(`  Username  : ${chalk.bold(user.username)}`);
                console.log(`  Email     : ${user.email ?? "-"}`);
                console.log(`  Role      : ${chalk.bold(user.role)}`);
                console.log(`  Last login: ${new Date(user.last_login_at).toLocaleString()}`);
            } catch (err: any) {
                spinner.fail("Failed to fetch user info");
                printError(err.response?.data?.message || err.message);
            }
        });
}