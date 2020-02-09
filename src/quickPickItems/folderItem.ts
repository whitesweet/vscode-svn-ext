import { QuickPickItem } from "vscode";
import { ISvnListItem, IBranchItem } from "../utils";

export default class FolderItem implements QuickPickItem {
    constructor(protected dir: ISvnListItem, protected isbranch: boolean, protected parent?: string) { }

    get label(): string {
        if (this.isbranch) {
            return `$(git-branch) ${this.dir.name}`;
        }
        return `$(file-directory) ${this.dir.name}`;
    }

    get description(): string {
        if (!this.isbranch) {
            return "";
        }
        return `r${this.dir.commit.revision} | ${
            this.dir.commit.author
            } | ${new Date(this.dir.commit.date).toLocaleString()}`;
    }

    get path(): string {
        if (this.parent) {
            return `${this.parent}/${this.dir.name}`;
        }
        return this.dir.name;
    }

    get branch(): IBranchItem | undefined {
        if (!this.isbranch) {
            return;
        }
        return {
            name: `${this.dir.name}`,
            path: this.path
        };
    }
}
