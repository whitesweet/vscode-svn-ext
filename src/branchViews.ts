import * as vscode from 'vscode';
import { BranchViewItem } from './branch';
import * as minimatch from "minimatch";
import { Commands } from './commands';

export class BranchViewsProvider implements vscode.TreeDataProvider<BranchViewItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<BranchViewItem | undefined> = new vscode.EventEmitter<BranchViewItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<BranchViewItem | undefined> = this._onDidChangeTreeData.event;

    constructor(private workspaceFolders: vscode.WorkspaceFolder[], private detectLevel: number, private filesExcludes: object, private commands: Commands) {
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: BranchViewItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: BranchViewItem): Thenable<BranchViewItem[]> {
        if (element) {
            if (element.level <= this.detectLevel) {
                return Promise.resolve(this.getPathItems(element));
            }
            else {
                return Promise.resolve([]);
            }
        } else {
            return Promise.resolve([new BranchViewItem(this.workspaceFolders[0].name, "", this.workspaceFolders[0].uri, 0, vscode.TreeItemCollapsibleState.Collapsed)]);
        }
    }

    private async getPathItems(element?: BranchViewItem): Promise<BranchViewItem[]> {
        if (element && element.uri) {
            const items: BranchViewItem[] = [];
            const result = await vscode.workspace.fs.readDirectory(element.uri);

            for (let value of result) {
                const filepath = element.uri.fsPath + "\/" + value[0];
                // path is to be display
                let istoskip = false;
                for (let ele of Object.entries(this.filesExcludes)) {
                    if (ele[1] && minimatch(value[0], ele[0])) {
                        istoskip = true;
                        break;
                    }
                }
                if (istoskip) {
                    continue;
                }
                try {
                    // path is branch
                    const cmdResult = await this.commands.getInfo(filepath);
                    if (cmdResult.relativeUrl.indexOf("branch") < 0 && element.level + 1 === this.detectLevel) {
                        continue;
                    }
                    else {
                        let index = cmdResult.url.indexOf("/branches");
                        if (index < 0){
                            index = cmdResult.url.indexOf("/tags");
                        }
                        let branchname = index < 0 ? "" : cmdResult.url.substr(index);
                        if (value[1] === vscode.FileType.Directory) {
                            items.push(new BranchViewItem(value[0], branchname, vscode.Uri.file(filepath), element.level + 1, element.level + 1 === this.detectLevel ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed));
                        }
                        else if (value[1] === vscode.FileType.File) {
                            items.push(new BranchViewItem(value[0], branchname, vscode.Uri.file(filepath), element.level + 1, vscode.TreeItemCollapsibleState.None));
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            return items;
        }
        return [];
    }
}