import { fixPathSeparator, IExecutionResult, IDisposable, toDisposable, parseInfoXml, ISvnInfo, parseSvnList, ISvnListItem } from "./utils";
import * as cp from "child_process";
import * as proc from "process";
import { Readable, EventEmitter } from "stream";
import { iconv } from "./vscodeModules";

export class Commands {
    private _svnCmd: string;

    private _onOutput = new EventEmitter();
    get onOutput(): EventEmitter {
        return this._onOutput;
    }

    public logOutput(output: string): void {
        this._onOutput.emit("log", output);
    }

    constructor(value?: string) {
        this._svnCmd = value ? value : "";
    }

    private _infoCache: {
        [index: string]: ISvnInfo;
    } = {};

    public async listUrl(root: string, url: string): Promise<ISvnListItem[]>{
        const result = await this.exec(root, ["list", url, "--xml"]);
        return parseSvnList(result.stdout);
    }

    public async switchByDir(cwdPath: string, path: string, force: boolean = false) {
        const args = ["switch", path].concat(force ? ["--ignore-ancestry"] : []);
        cwdPath = fixPathSeparator(cwdPath);
        return await this.exec(cwdPath, args);
    }

    public async getInfo(cwdPath: string = ""): Promise<ISvnInfo> {
        const args = ["info", "--xml"];
        if (cwdPath) {
            cwdPath = fixPathSeparator(cwdPath);
            args.push(cwdPath);
        }
        const result = await this.exec("", args);
        this._infoCache[cwdPath] = await parseInfoXml(result.stdout);
        return this._infoCache[cwdPath];
    }

    public async exec(
        cwdPath: string,
        args: any[]
    ): Promise<IExecutionResult> {

        const defaults: cp.SpawnOptions = {
            env: proc.env
        };

        defaults.env = Object.assign({}, proc.env, {}, {
            LC_ALL: "en_US.UTF-8",
            LANG: "en_US.UTF-8"
        });
        if (cwdPath) {
            defaults.cwd = cwdPath;
        }

        const argsOut = args.map(arg => (/ |^$/.test(arg) ? `'${arg}'` : arg));
        this.logOutput(
            `[${cwdPath}]$ svn ${argsOut.join(" ")}`
        );

        const process = cp.spawn(this._svnCmd, args, defaults);

        const disposables: IDisposable[] = [];

        const once = (
            ee: NodeJS.EventEmitter,
            name: string,
            fn: (...args: any[]) => void
        ) => {
            ee.once(name, fn);
            disposables.push(toDisposable(() => ee.removeListener(name, fn)));
        };

        const on = (
            ee: NodeJS.EventEmitter,
            name: string,
            fn: (...args: any[]) => void
        ) => {
            ee.on(name, fn);
            disposables.push(toDisposable(() => ee.removeListener(name, fn)));
        };

        const [exitCode, stdout, stderr] = await Promise.all<any>([
            new Promise<number>((resolve, reject) => {
                once(process, "error", reject);
                once(process, "exit", resolve);
            }),
            new Promise<Buffer>(resolve => {
                const buffers: Buffer[] = [];
                on(process.stdout as Readable, "data", (b: Buffer) => buffers.push(b));
                once(process.stdout as Readable, "close", () =>
                    resolve(Buffer.concat(buffers))
                );
            }),
            new Promise<string>(resolve => {
                const buffers: Buffer[] = [];
                on(process.stderr as Readable, "data", (b: Buffer) => buffers.push(b));
                once(process.stderr as Readable, "close", () =>
                    resolve(Buffer.concat(buffers).toString())
                );
            })
        ]);

        disposables.forEach(disposable => disposable.dispose());

        const decodedStdout = iconv.decode(stdout, "utf8");

        return { exitCode, stdout: decodedStdout, stderr };
    }
}