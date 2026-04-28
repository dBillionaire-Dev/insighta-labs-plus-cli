import Table from "cli-table3";
import chalk from "chalk";

export function printProfileTable(profiles: any[]): void {
    if (profiles.length === 0) {
        console.log(chalk.yellow("No profiles found."));
        return;
    }

    const table = new Table({
        head: [
            chalk.cyan("Name"),
            chalk.cyan("Gender"),
            chalk.cyan("Age"),
            chalk.cyan("Age Group"),
            chalk.cyan("Country"),
            chalk.cyan("ID"),
        ],
        colWidths: [22, 10, 6, 12, 10, 38],
        wordWrap: true,
    });

    for (const p of profiles) {
        table.push([
            p.name,
            p.gender ?? "-",
            p.age ?? "-",
            p.age_group ?? "-",
            p.country_id ?? "-",
            chalk.gray(p.id),
        ]);
    }

    console.log(table.toString());
}

export function printProfileDetail(p: any): void {
    const table = new Table({
        style: { head: [], border: [] },
    });

    table.push(
        [chalk.cyan("ID"), p.id],
        [chalk.cyan("Name"), p.name],
        [chalk.cyan("Gender"), `${p.gender} (${(p.gender_probability * 100).toFixed(0)}%)`],
        [chalk.cyan("Age"), `${p.age} (${p.age_group})`],
        [chalk.cyan("Country"), `${p.country_name ?? p.country_id} (${p.country_id})`],
        [chalk.cyan("Country Prob."), `${(p.country_probability * 100).toFixed(0)}%`],
        [chalk.cyan("Created"), new Date(p.created_at).toLocaleString()]
    );

    console.log(table.toString());
}

export function printPaginationInfo(data: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}): void {
    console.log(
        chalk.gray(
            `\nPage ${data.page} of ${data.total_pages} — showing ${data.limit} of ${data.total} total profiles`
        )
    );
}

export function printError(message: string): void {
    console.error(chalk.red(`\n✖ Error: ${message}`));
}

export function printSuccess(message: string): void {
    console.log(chalk.green(`\n✔ ${message}`));
}