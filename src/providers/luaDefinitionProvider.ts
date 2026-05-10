import * as vscode from 'vscode';
import { SymbolIndex } from '../index/symbolIndex';

export class LuaDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private index: SymbolIndex) {}

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.Location[] {
        const line = document.lineAt(position).text;
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) { return []; }

        const word = document.getText(wordRange);
        const locations: vscode.Location[] = [];

        // Detect if cursor is on a method call: obj:method or obj.method
        const prefix = this.extractPrefix(line, wordRange.start.character);
        const isMethodCall = prefix !== null;

        if (isMethodCall && prefix) {
            // Try container-specific match first
            const containerMatches = this.index.findExact(word).filter(
                (s) => s.container === prefix
            );
            locations.push(...containerMatches.map((s) => new vscode.Location(s.uri, s.range)));

            // If no container match, try any method with this name
            if (locations.length === 0) {
                const allMatches = this.index.findExact(word).filter(
                    (s) => s.kind === vscode.SymbolKind.Method || s.kind === vscode.SymbolKind.Function
                );
                locations.push(...allMatches.map((s) => new vscode.Location(s.uri, s.range)));
            }
        } else {
            // Global function, class, or variable
            const exactMatches = this.index.findExact(word);
            locations.push(...exactMatches.map((s) => new vscode.Location(s.uri, s.range)));
        }

        // Deduplicate
        const seen = new Set<string>();
        return locations.filter((loc) => {
            const key = `${loc.uri.toString()}:${loc.range.start.line}:${loc.range.start.character}`;
            if (seen.has(key)) { return false; }
            seen.add(key);
            return true;
        });
    }

    private extractPrefix(line: string, wordStart: number): string | null {
        // Look backwards from word start to find : or .
        for (let i = wordStart - 1; i >= 0; i--) {
            const ch = line[i];
            if (ch === ':' || ch === '.') {
                // Extract the word before : or .
                const before = line.slice(0, i).trimEnd();
                const match = before.match(/([A-Za-z_]\w*)\s*$/);
                return match ? match[1] : null;
            }
            if (!/\s/.test(ch)) {
                break;
            }
        }
        return null;
    }
}
