import * as path from "path";
import * as xml2js from "xml2js";

const regexNormalizePath = new RegExp(path.sep === "/" ? "\\\\" : "/", "g");
const regexNormalizeWindows = new RegExp("^\\\\(\\w:)", "g");
export function fixPathSeparator(file: string) {
    file = file.replace(regexNormalizePath, path.sep);
    file = file.replace(regexNormalizeWindows, "$1"); // "\t:\test" => "t:\test"
    return file;
}

export interface IDisposable {
    dispose(): void;
}

export function toDisposable(dispose: () => void): IDisposable {
    return { dispose };
}

export interface IExecutionResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

export function camelcase(name: string) {
    return name
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
            return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
        })
        .replace(/[\s\-]+/g, "");
}

export interface ISvnInfo {
    kind: string;
    path: string;
    revision: string;
    url: string;
    relativeUrl: string;
    repository: {
        root: string;
        uuid: string;
    };
    wcInfo?: {
        wcrootAbspath: string;
        uuid: string;
    };
    commit: {
        revision: string;
        author: string;
        date: string;
    };
}

export async function parseInfoXml(content: string): Promise<ISvnInfo> {
    return new Promise<ISvnInfo>((resolve, reject) => {
        xml2js.parseString(
            content,
            {
                mergeAttrs: true,
                explicitRoot: false,
                explicitArray: false,
                attrNameProcessors: [camelcase],
                tagNameProcessors: [camelcase]
            },
            (err: any, result: { entry: ISvnInfo | PromiseLike<ISvnInfo> | undefined; }) => {
                if (err || typeof result.entry === "undefined") {
                    reject();
                }

                resolve(result.entry);
            }
        );
    });
}

export interface IBranchItem {
    name: string;
    path: string;
    isNew?: boolean;
}

export enum SvnKindType {
    FILE = "file",
    DIR = "dir"
}

export interface ISvnListItem {
    kind: SvnKindType;
    name: string;
    size: string;
    commit: {
        revision: string;
        author: string;
        date: string;
    };
}

export const xml2jsParseSettings = {
    mergeAttrs: true,
    explicitRoot: false,
    explicitArray: false,
    attrNameProcessors: [camelcase],
    tagNameProcessors: [camelcase]
};


export async function parseSvnList(content: string): Promise<ISvnListItem[]> {
    return new Promise<ISvnListItem[]>((resolve, reject) => {
        xml2js.parseString(content, xml2jsParseSettings, (err, result) => {
            if (err) {
                reject();
            }

            if (result.list && result.list.entry) {
                if (!Array.isArray(result.list.entry)) {
                    result.list.entry = [result.list.entry];
                }
                resolve(result.list.entry);
            } else {
                resolve([]);
            }
        });
    });
}

export function done<T>(promise: Promise<T>): Promise<void> {
    return promise.then<void>(() => void 0);
}