import { Commands } from "./commands";
import { selectBranch } from "./branch";
import * as vscode from "vscode";
import { IExecutionResult, fixPathSeparator } from "./utils";

export class Repository {
    private workspaceRoot: string;
    private uri: vscode.Uri;
    private commands: Commands;

    constructor(commands: Commands, uri: vscode.Uri, root: string) {
        this.commands = commands;
        this.uri = uri;
        this.workspaceRoot = root;
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
        const state = await vscode.workspace.fs.stat(this.uri);
        if (state.type === vscode.FileType.Directory) {
            return await this.commands.switchByDir(this.uri.path, branchUrl, force);
        }
        else if (state.type === vscode.FileType.File) {
            const cwdpath = this.uri.path.substring(0, this.uri.path.lastIndexOf("/"));
            return await this.commands.switchByFile(cwdpath, branchUrl, fixPathSeparator(this.uri.path), force);
        }
    }

    public async selectBranch() {
        const branch = await selectBranch(this, true);
        if (!branch) {
            return;
        }

        const result = await this.switchBranch(branch.path);
        if (result && result.stderr.indexOf("ignore-ancestry") > 0) {
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
        else if (result && result.stderr.length > 0) {
            vscode.window.showErrorMessage("Unable to switch branch");
        }
        vscode.commands.executeCommand("extension.branchViews.refresh");
    }
}