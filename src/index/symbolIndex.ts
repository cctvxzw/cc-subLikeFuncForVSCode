import * as vscode from 'vscode';
import { SymbolInfo, FileIndex, SymbolMap } from './types';

export class SymbolIndex {
    private fileMap = new Map<string, FileIndex>();
    private nameIndex: SymbolMap = new Map();

    addOrUpdate(uri: vscode.Uri, symbols: SymbolInfo[]): void {
        this.remove(uri);
        const fileIndex: FileIndex = {
            uri,
            symbols,
            version: 1,
            lastModified: Date.now(),
        };
        this.fileMap.set(uri.toString(), fileIndex);
        for (const sym of symbols) {
            const list = this.nameIndex.get(sym.name);
            if (list) {
                list.push(sym);
            } else {
                this.nameIndex.set(sym.name, [sym]);
            }
        }
    }

    remove(uri: vscode.Uri): void {
        const key = uri.toString();
        const existing = this.fileMap.get(key);
        if (!existing) { return; }
        for (const sym of existing.symbols) {
            const list = this.nameIndex.get(sym.name);
            if (list) {
                const filtered = list.filter((s) => s.uri.toString() !== key);
                if (filtered.length === 0) {
                    this.nameIndex.delete(sym.name);
                } else {
                    this.nameIndex.set(sym.name, filtered);
                }
            }
        }
        this.fileMap.delete(key);
    }

    findByUri(uri: vscode.Uri): SymbolInfo[] {
        return this.fileMap.get(uri.toString())?.symbols ?? [];
    }

    findByName(query: string): SymbolInfo[] {
        const results: SymbolInfo[] = [];
        const lowerQuery = query.toLowerCase();
        for (const [name, symbols] of this.nameIndex) {
            if (this.fuzzyMatch(name.toLowerCase(), lowerQuery)) {
                results.push(...symbols);
            }
        }
        return results;
    }

    findExact(name: string): SymbolInfo[] {
        return this.nameIndex.get(name) ?? [];
    }

    getAll(): SymbolInfo[] {
        const results: SymbolInfo[] = [];
        for (const symbols of this.nameIndex.values()) {
            results.push(...symbols);
        }
        return results;
    }

    getFileCount(): number {
        return this.fileMap.size;
    }

    getUris(): vscode.Uri[] {
        const uris: vscode.Uri[] = [];
        for (const fileIndex of this.fileMap.values()) {
            uris.push(fileIndex.uri);
        }
        return uris;
    }

    clear(): void {
        this.fileMap.clear();
        this.nameIndex.clear();
    }

    private fuzzyMatch(name: string, query: string): boolean {
        let qi = 0;
        for (let ni = 0; ni < name.length && qi < query.length; ni++) {
            if (name[ni] === query[qi]) {
                qi++;
            }
        }
        return qi === query.length;
    }
}
