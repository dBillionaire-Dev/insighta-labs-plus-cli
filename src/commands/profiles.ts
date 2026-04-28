import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { api } from "../utils/api";
import {
    printProfileTable,
    printProfileDetail,
    printPaginationInfo,
    printError,
    printSuccess,
} from "../utils/display";
import { isLoggedIn } from "../utils/credentials";

function requireLogin(): boolean {
    if (!isLoggedIn()) {
        console.log(chalk.yellow("You are not logged in. Run: insighta login"));
        return false;
    }
    return true;
}

export function registerProfilesCommand(program: Command): void {
    const profiles = program
        .command("profiles")
        .description("Manage and query profiles");

    // ── list ──
    profiles
        .command("list")
        .description("List profiles with optional filters")
        .option("--gender <gender>", "Filter by gender (male/female)")
        .option("--country <country_id>", "Filter by country ID (e.g. NG)")
        .option("--age-group <group>", "Filter by age group (child/teenager/adult/senior)")
        .option("--min-age <age>", "Minimum age")
        .option("--max-age <age>", "Maximum age")
        .option("--sort-by <field>", "Sort by: age, created_at, gender_probability")
        .option("--order <order>", "Order: asc or desc")
        .option("--page <page>", "Page number", "1")
        .option("--limit <limit>", "Results per page (max 50)", "10")
        .action(async (options) => {
            if (!requireLogin()) return;

            const spinner = ora("Fetching profiles...").start();
            try {
                const params: Record<string, any> = {
                    page: options.page,
                    limit: options.limit,
                };

                if (options.gender) params.gender = options.gender;
                if (options.country) params.country_id = options.country;
                if (options.ageGroup) params.age_group = options.ageGroup;
                if (options.minAge) params.min_age = options.minAge;
                if (options.maxAge) params.max_age = options.maxAge;
                if (options.sortBy) params.sort_by = options.sortBy;
                if (options.order) params.order = options.order;

                const res = await api.get("/api/profiles", { params });
                spinner.stop();

                printProfileTable(res.data.data);
                printPaginationInfo(res.data);
            } catch (err: any) {
                spinner.fail("Failed to fetch profiles");
                printError(err.response?.data?.message || err.message);
            }
        });

    // ── get ──
    profiles
        .command("get <id>")
        .description("Get a single profile by ID")
        .action(async (id) => {
            if (!requireLogin()) return;

            const spinner = ora("Fetching profile...").start();
            try {
                const res = await api.get(`/api/profiles/${id}`);
                spinner.stop();
                printProfileDetail(res.data.data);
            } catch (err: any) {
                spinner.fail("Profile not found");
                printError(err.response?.data?.message || err.message);
            }
        });

    // ── search ──
    profiles
        .command("search <query>")
        .description('Search profiles using natural language e.g. "young males from nigeria"')
        .option("--page <page>", "Page number", "1")
        .option("--limit <limit>", "Results per page (max 50)", "10")
        .action(async (query, options): Promise<void> => {
            if (!requireLogin()) return;

            const spinner = ora("Searching...").start();
            try {
                const res = await api.get("/api/profiles/search", {
                    params: { q: query, page: options.page, limit: options.limit },
                });
                spinner.stop();

                console.log(chalk.gray(`\nQuery: "${query}"`));
                printProfileTable(res.data.data);
                printPaginationInfo(res.data);
            } catch (err: any) {
                spinner.fail("Search failed");
                printError(err.response?.data?.message || err.message);
            }
        });

    // ── create ──
    profiles
        .command("create")
        .description("Create a new profile (admin only)")
        .requiredOption("--name <name>", "Person's name")
        .action(async (options): Promise<void> => {
            if (!requireLogin()) return;

            const spinner = ora(`Creating profile for "${options.name}"...`).start();
            try {
                const res = await api.post("/api/profiles", { name: options.name });
                spinner.stop();

                if (res.data.message === "Profile already exists") {
                    console.log(chalk.yellow("\nProfile already exists:"));
                } else {
                    printSuccess("Profile created!");
                }
                printProfileDetail(res.data.data);
            } catch (err: any) {
                spinner.fail("Failed to create profile");
                printError(err.response?.data?.message || err.message);
            }
        });

    // ── delete ──
    profiles
        .command("delete <id>")
        .description("Delete a profile by ID (admin only)")
        .action(async (id): Promise<void> => {
            if (!requireLogin()) return;

            const spinner = ora("Deleting profile...").start();
            try {
                await api.delete(`/api/profiles/${id}`);
                spinner.succeed(chalk.green("Profile deleted successfully."));
            } catch (err: any) {
                spinner.fail("Failed to delete profile");
                printError(err.response?.data?.message || err.message);
            }
        });

    // ── export ──
    profiles
        .command("export")
        .description("Export profiles to a CSV file")
        .option("--gender <gender>", "Filter by gender")
        .option("--country <country_id>", "Filter by country ID")
        .option("--age-group <group>", "Filter by age group")
        .option("--output <filename>", "Output filename", "profiles.csv")
        .action(async (options): Promise<void> => {
            if (!requireLogin()) return;

            const spinner = ora("Exporting profiles...").start();
            try {
                const params: Record<string, any> = {};
                if (options.gender) params.gender = options.gender;
                if (options.country) params.country_id = options.country;
                if (options.ageGroup) params.age_group = options.ageGroup;

                const res = await api.get("/api/profiles/export", {
                    params,
                    responseType: "text",
                });

                const outputPath = path.resolve(process.cwd(), options.output);
                fs.writeFileSync(outputPath, res.data);

                spinner.succeed(chalk.green(`Exported to: ${outputPath}`));
            } catch (err: any) {
                spinner.fail("Export failed");
                printError(err.response?.data?.message || err.message);
            }
        });
}