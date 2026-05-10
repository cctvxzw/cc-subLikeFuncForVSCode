import * as vscode from 'vscode';
import { SymbolIndex } from '../index/symbolIndex';
import { SymbolInfo } from '../index/types';

export class LuaDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    constructor(private index: SymbolIndex) {}

    provideDocumentSymbols(
        document: vscode.TextDocument
    ): vscode.DocumentSymbol[] {
        const symbols = this.index.findByUri(document.uri);
        return this.buildTree(symbols);
    }

    private buildTree(symbols: SymbolInfo[]): vscode.DocumentSymbol[] {
        const roots: vscode.DocumentSymbol[] = [];
        const containerMap = new Map<string, vscode.DocumentSymbol>();

        // First pass: create all document symbols
        for (const sym of symbols) {
            const docSym = new vscode.DocumentSymbol(
                sym.name,
                sym.detail || '',
                sym.kind,
                sym.range,
                sym.selectionRange
            );

            if (sym.container && containerMap.has(sym.container)) {
                const parent = containerMap.get(sym.container)!;
                parent.children.push(docSym);
            } else {
                roots.push(docSym);
            }

            // Register as container if it's a class or namespace
            if (sym.kind === vscode.SymbolKind.Class || sym.kind === vscode.SymbolKind.Namespace) {
                containerMap.set(sym.name, docSym);
            }
        }

        return roots;
    }
}
