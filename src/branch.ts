import { ProgressLocation, window } from "vscode";
import ParentFolderItem from "./quickPickItems/parentFolderItem";
import FolderItem from "./quickPickItems/folderItem";
import { IBranchItem, SvnKindType } from "./utils";
import { Repository } from "./repository";

export async function selectBranch(
    repository: Repository,
    allowNew = false,
    folder?: string
): Promise<IBranchItem | undefined> {
    const promise = repository.list(folder);

    window.withProgress(
        { location: ProgressLocation.Window, title: "Checking remote branches" },
        () => promise
    );

    const list = await promise;
    const dirs = list.filter((item: { kind: SvnKindType; }) => item.kind === SvnKindType.DIR);

    const picks = [];
    if (folder) {
        const parts = folder.split("/");
        parts.pop();
        const parent = parts.join("/");
        picks.push(new ParentFolderItem(parent));
    }
    for (let i = 0; i < dirs.length; i++) {
        picks.push(new FolderItem(dirs[i], false, folder));
        picks.push(new FolderItem(dirs[i], true, folder));
    }

    const choice = await window.showQuickPick(picks);
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
