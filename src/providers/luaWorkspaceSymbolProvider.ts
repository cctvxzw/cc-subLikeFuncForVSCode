import * as vscode from 'vscode';
import { SymbolIndex } from '../index/symbolIndex';
import { SymbolInfo } from '../index/types';

export class LuaWorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
    constructor(private index: SymbolIndex) {}

    provideWorkspaceSymbols(
        query: string,
        _token: vscode.CancellationToken
    ): vscode.SymbolInformation[] {
        const symbols = query.length === 0 ? this.index.getAll() : this.index.findByName(query);
        return symbols.map((sym) =>
            new vscode.SymbolInformation(
                sym.name,
                sym.kind,
                sym.container || '',
                new vscode.Location(sym.uri, sym.range)
            )
        );
    }
}
