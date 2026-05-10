import * as vscode from 'vscode';

export interface SearchConfig {
    luaInclude: string[];
    luaExclude: string[];
    csharpInclude: string[];
    csharpExclude: string[];
    enableCSharp: boolean;
    indexOnStartup: boolean;
}

export function getConfig(): SearchConfig {
    const cfg = vscode.workspace.getConfiguration('sublimeSearch');
    return {
        luaInclude: cfg.get<string[]>('lua.include', ['**/*.lua']),
        luaExclude: cfg.get<string[]>('lua.exclude', ['**/lua52/**', '**/tolua/**', '**/node_modules/**', '**/.git/**']),
        csharpInclude: cfg.get<string[]>('csharp.include', ['**/*.cs']),
        csharpExclude: cfg.get<string[]>('csharp.exclude', ['**/Editor/**', '**/node_modules/**', '**/.git/**']),
        enableCSharp: cfg.get<boolean>('enableCSharp', true),
        indexOnStartup: cfg.get<boolean>('indexOnStartup', true),
    };
}

export function onConfigChange(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('sublimeSearch')) {
            callback();
        }
    });
}
