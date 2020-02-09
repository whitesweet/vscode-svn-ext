import { Commands } from "./commands";
import { selectBranch } from "./branch";
import * as vscode from "vscode";

export class Repository {
    private workspaceRoot: string;
    private cwdPath: string;
    private commands: Commands;

    constructor(commands: Commands, cwdPath: string, root: string) {
        this.workspaceRoot = root;
        this.cwdPath = cwdPath;
        this.commands = commands;
    }

    public async list(folder?: string) {
        let url = await this.getRepoUrl();
        if (folder) {
            url += "/" + folder;
        }
        return await this.commands.listUrl(this.workspaceRoot, url);
    }

    public async getRepoUrl() {
        const info = await this.commands.getInfo(this.workspaceRoot);
        return info.repository.root;
    }

    public async switchBranch(ref: string, force: boolean = false) {
        const repoUrl = await this.getRepoUrl();
        const branchUrl = repoUrl + "/" + ref;
        return await this.commands.switchByDir(this.cwdPath, branchUrl, force);
    }

    public async selectBranch() {
        const branch = await selectBranch(this, true);
        if (!branch) {
            return;
        }

        const result = await this.switchBranch(branch.path);
        if (result.stderr.indexOf("ignore-ancestry") > 0) {
            const answer = await vscode.window.showErrorMessage(
                "Seems like these branches don't have a common ancestor. " +
                " Do you want to retry with '--ignore-ancestry' option?",
                "Yes",
                "No"
            );
            if (answer === "Yes") {
                await this.switchBranch(branch.path, true);
                vscode.commands.executeCommand("extension.branchViews.refresh");
            }
        }
        else if (result.stderr.length > 0) {
            vscode.window.showErrorMessage("Unable to switch branch");
        }
        vscode.commands.executeCommand("extension.branchViews.refresh");
    }
}