import * as vscode from 'vscode';
import { SymbolIndex } from '../index/symbolIndex';

export class LuaHoverProvider implements vscode.HoverProvider {
    constructor(private index: SymbolIndex) {}

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) { return undefined; }

        const word = document.getText(wordRange);
        if (this.isKeywordOrBuiltin(word)) { return undefined; }

        const defs = this.index.findExact(word).filter(
            d => d.kind === vscode.SymbolKind.Function || d.kind === vscode.SymbolKind.Method
        );
        if (defs.length === 0) { return undefined; }

        const refs = await this.findReferences(word);

        const lines: string[] = [];

        // Show definitions first
        if (defs.length > 0) {
            lines.push(`**Definition:**`);
            for (const def of defs.slice(0, 5)) {
                const fileName = def.uri.path.split('/').pop() || def.uri.path;
                const link = `[${fileName}:${def.range.start.line + 1}](${def.uri.toString()}#L${def.range.start.line + 1})`;
                const kind = vscode.SymbolKind[def.kind];
                lines.push(`- ${link} *${kind}* ${def.detail || ''}`);
            }
            lines.push('');
        }

        // Show references
        if (refs.length > 0) {
            lines.push(`**${refs.length} reference(s):**`);
            lines.push('');
            for (const ref of refs.slice(0, 10)) {
                const fileName = ref.uri.path.split('/').pop() || ref.uri.path;
                const link = `[${fileName}:${ref.line + 1}](${ref.uri.toString()}#L${ref.line + 1})`;
                lines.push(`- ${link}`);
            }
            if (refs.length > 10) {
                lines.push('');
                lines.push(`_... and ${refs.length - 10} more_`);
            }
        } else {
            lines.push(`**No references found.**`);
        }

        const markdown = new vscode.MarkdownString(lines.join('\n'));
        markdown.isTrusted = true;
        return new vscode.Hover(markdown, wordRange);
    }

    private async findReferences(word: string): Promise<Array<{ uri: vscode.Uri; line: number; text: string }>> {
        const results: Array<{ uri: vscode.Uri; line: number; text: string }> = [];
        const uris = this.index.getUris();

        // Exclude definition lines
        const definitions = new Set<string>();
        for (const sym of this.index.findExact(word)) {
            definitions.add(`${sym.uri.toString()}:${sym.range.start.line}`);
        }

        for (const uri of uris) {
            try {
                const content = await vscode.workspace.fs.readFile(uri);
                const text = new TextDecoder('utf-8').decode(content);
                const lines = text.split(/\r?\n/);
                const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`);

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (definitions.has(`${uri.toString()}:${i}`)) { continue; }
                    if (line.trim().startsWith('--')) { continue; }
                    if (regex.test(line)) {
                        results.push({ uri, line: i, text: line });
                    }
                }
            } catch {
                // ignore unreadable files
            }
        }

        return results;
    }

    private isKeywordOrBuiltin(word: string): boolean {
        const keywords = new Set([
            'if', 'then', 'else', 'elseif', 'end', 'for', 'while', 'do',
            'repeat', 'until', 'function', 'local', 'return', 'in', 'not',
            'and', 'or', 'nil', 'true', 'false', 'break', 'goto',
            'print', 'pairs', 'ipairs', 'next', 'type', 'tonumber', 'tostring',
            'math', 'table', 'string', 'io', 'os', 'debug', 'coroutine', 'package',
            'require', 'select', 'pcall', 'xpcall', 'load', 'loadfile', 'dofile',
            'rawget', 'rawset', 'rawequal', 'setmetatable', 'getmetatable',
            'class', 'typeof', 'UnityEngine',
        ]);
        return keywords.has(word);
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}