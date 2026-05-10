import * as vscode from 'vscode';

export interface SymbolInfo {
    name: string;
    kind: vscode.SymbolKind;
    uri: vscode.Uri;
    range: vscode.Range;
    selectionRange: vscode.Range;
    container?: string;
    language: 'lua' | 'csharp';
    detail?: string;
}

export interface FileIndex {
    uri: vscode.Uri;
    symbols: SymbolInfo[];
    version: number;
    lastModified: number;
}

export type SymbolMap = Map<string, SymbolInfo[]>;
