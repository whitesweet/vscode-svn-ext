// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Commands } from './commands';
import { Repository } from './repository';
import { window } from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    const outputChannel = window.createOutputChannel("vscode-svn-ext");
    outputChannel.show();
    outputChannel.appendLine('"vscode-svn-ext" is now active!');
    const svnPath = vscode.workspace
        .getConfiguration()
        .get<string>("vscodeSvnExt.svn.path");

    let commands = new Commands(svnPath);
    const onOutput = (str: string) => outputChannel.appendLine(str);
    commands.onOutput.addListener("log", onOutput);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.switchBranch', (uri) => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        //vscode.window.showInformationMessage(uri ? uri.path : '');

        // //info
        // commands.getInfo(uri.path).then((info) => {
        //     console.log(info);
        // }).catch((err: any) => console.error(err));
        // //swtich
        // commands.switchByDir(uri.path).then((info) => {
        //     console.log(info);
        // }).catch((err: any) => console.error(err));

        //
        // commands.getInfo(uri.path).then(
        //     (info) => {
        //         console.log(info);
        //         const repo = new Repository(commands, info.wcInfo?.wcrootAbspath ? info.wcInfo?.wcrootAbspath : "");
        //         console.log(repo);
        //         selectBranch(repo, true).then((info) => {
        //             console.log(info);
        //         }).catch((err: any) => console.error(err));
        //     }
        // ).catch((err: any) => console.error(err));
        commands.getInfo(uri.path).then(
            (info) => {
                const repository = new Repository(commands, info.wcInfo?.wcrootAbspath ? info.wcInfo?.wcrootAbspath : "");
                repository.selectBranch();
            }
        ).catch((err: any) => console.error(err));
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
