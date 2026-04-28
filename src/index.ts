#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { registerLoginCommand } from "./commands/login";
import { registerLogoutCommand, registerWhoamiCommand } from "./commands/auth";
import { registerProfilesCommand } from "./commands/profiles";

const program = new Command();

program
    .name("insighta")
    .description("Insighta Labs+ CLI — query demographic profiles from your terminal")
    .version("1.0.0");

registerLoginCommand(program);
registerLogoutCommand(program);
registerWhoamiCommand(program);
registerProfilesCommand(program);

program.parse(process.argv);