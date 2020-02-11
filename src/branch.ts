import * as vscode from "vscode";
import ParentFolderItem from "./quickPickItems/parentFolderItem";
import FolderItem from "./quickPickItems/folderItem";
import { IBranchItem, SvnKindType } from "./utils";
import { Repository } from "./repository";
import * as path from 'path';

export async function selectBranch(
    repository: Repository,
    allowNew = false,
    folder?: string
): Promise<IBranchItem | undefined> {

    const promise = repository.list(folder);

    vscode.window.withProgress(
        { location: vscode.ProgressLocation.Window, title: "Checking remote branches" },
        () => promise
    );

    const dirs = await promise;

    const picks = [];
    if (folder) {
        const parts = folder.split("/");
        parts.pop();
        const parent = parts.join("/");
        picks.push(new ParentFolderItem(parent));
    }
    for (let i = 0; i < dirs.length; i++) {
        if(dirs[i].kind === SvnKindType.DIR){
            picks.push(new FolderItem(dirs[i], false, folder));
        }
        picks.push(new FolderItem(dirs[i], true, folder));
    }

    const choice = await vscode.window.showQuickPick(picks);
    if (!choice) {
        return;
    }
    if (choice instanceof ParentFolderItem) {
        return selectBranch(repository, allowNew, choice.path ? choice.path : "");
    }
    if (choice instanceof FolderItem) {
        if (choice.branch) {
            return choice.branch;
        }
        return selectBranch(repository, allowNew, choice.path);
    }

    return;
}


export class BranchViewItem extends vscode.TreeItem {

    constructor(
        //public readonly label: string,
        public readonly branch: string,
        public readonly uri: vscode.Uri,
        public readonly level: number,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly isFile?: boolean
    ) {
        super(uri, collapsibleState);
        if (!isFile){
            this.iconPath = {
                light: path.join(__filename, '..', '..', 'resources', 'folder.svg'),
                dark: path.join(__filename, '..', '..', 'resources', 'folder.svg')
            };
        }
    }

    get description(): string {
        if(this.branch){
            return this.branch;
        }
        return "";
    }
}
