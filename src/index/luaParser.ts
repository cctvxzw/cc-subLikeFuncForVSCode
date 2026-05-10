import * as vscode from 'vscode';
import { SymbolInfo } from './types';

const CLASS_REGEX = /^(?:local\s+)?([A-Za-z_]\w*)\s*=\s*class\s*\(\s*["']([^"']+)["'](?:\s*,\s*([A-Za-z_][\w.]*))?\s*\)/;
const FUNCTION_REGEX = /^\s*(?:local\s+)?function\s+([A-Za-z_]\w*)\s*(?:\(|$)/;
const METHOD_REGEX = /^\s*(?:local\s+)?function\s+([A-Za-z_]\w*)[:\.]([A-Za-z_]\w*)\s*(?:\(|$)/;
const METHOD_CALL_REGEX = /([A-Za-z_]\w*)[:\.]([A-Za-z_]\w*)\s*\(/g;

const BUILTIN_CALLERS = new Set([
    'table', 'string', 'math', 'io', 'os', 'coroutine', 'debug', 'package',
    'print', 'pairs', 'ipairs', 'next', 'type', 'tonumber', 'tostring',
    'collectgarbage', 'error', 'assert', 'pcall', 'xpcall', 'load', 'loadfile', 'dofile',
    'rawget', 'rawset', 'rawequal', 'setmetatable', 'getmetatable',
    'require', 'select', 'UnityEngine', 'typeof', 'class',
]);

export function parseLuaDocument(uri: vscode.Uri, content: string): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const lines = content.split(/\r?\n/);
    const classes = new Map<string, { line: number; range: vscode.Range }>();
    const knownNames = new Set<string>();

    // First pass: collect classes
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const classMatch = line.match(CLASS_REGEX);
        if (classMatch) {
            const varName = classMatch[1];
            const className = classMatch[2];
            const baseClass = classMatch[3];
            const range = new vscode.Range(i, 0, i, line.length);
            classes.set(varName, { line: i, range });
            classes.set(className, { line: i, range });
            symbols.push({
                name: className,
                kind: vscode.SymbolKind.Class,
                uri,
                range,
                selectionRange: range,
                container: baseClass,
                language: 'lua',
                detail: baseClass ? `class : ${baseClass}` : 'class',
            });
            knownNames.add(className);
        }
    }

    // Second pass: collect explicit function definitions
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/^\s*function\s*\(/.test(line)) {
            continue;
        }

        const methodMatch = line.match(METHOD_REGEX);
        if (methodMatch) {
            const className = methodMatch[1];
            const methodName = methodMatch[2];
            const range = new vscode.Range(i, 0, i, line.length);
            symbols.push({
                name: methodName,
                kind: vscode.SymbolKind.Method,
                uri,
                range,
                selectionRange: range,
                container: className,
                language: 'lua',
                detail: `${className}:${methodName}`,
            });
            knownNames.add(methodName);
            continue;
        }

        const funcMatch = line.match(FUNCTION_REGEX);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const range = new vscode.Range(i, 0, i, line.length);
            const isLocal = /^\s*local\b/.test(line);
            symbols.push({
                name: funcName,
                kind: vscode.SymbolKind.Function,
                uri,
                range,
                selectionRange: range,
                language: 'lua',
                detail: isLocal ? 'local function' : 'global function',
            });
            knownNames.add(funcName);
        }
    }

    // Third pass: collect method calls (e.g. UIPanel.new(), obj:method())
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match;
        while ((match = METHOD_CALL_REGEX.exec(line)) !== null) {
            const caller = match[1];
            const methodName = match[2];

            // Skip builtins like table.insert(), string.format()
            if (BUILTIN_CALLERS.has(caller)) { continue; }
            // Skip if already extracted from a definition
            if (knownNames.has(methodName)) { continue; }

            const startChar = match.index + caller.length + 1;
            const range = new vscode.Range(i, startChar, i, startChar + methodName.length);
            symbols.push({
                name: methodName,
                kind: vscode.SymbolKind.Method,
                uri,
                range,
                selectionRange: range,
                container: caller,
                language: 'lua',
                detail: `${caller}.${methodName}`,
            });
            knownNames.add(methodName);
        }
    }

    return symbols;
}