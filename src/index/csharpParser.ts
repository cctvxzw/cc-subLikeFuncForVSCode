import * as vscode from 'vscode';
import { SymbolInfo } from './types';

const CLASS_REGEX = /^\s*(?:public|internal|private|protected)?\s*(?:abstract|sealed|static)?\s*(?:class|interface|struct|enum)\s+([A-Za-z_]\w*)/;
const METHOD_REGEX = /^\s*(?:public|private|protected|internal)?\s*(?:static|virtual|abstract|override|new)?\s*(?:[\w<>,\[\]\s]+)\s+([A-Za-z_]\w*)\s*\(/;
const PROPERTY_REGEX = /^\s*(?:public|private|protected|internal)?\s*(?:static|virtual|abstract|override|new)?\s*(?:[\w<>,\[\]\s]+)\s+([A-Za-z_]\w*)\s*\{/;

export function parseCSharpDocument(uri: vscode.Uri, content: string): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const lines = content.split(/\r?\n/);
    let currentNamespace = '';
    let currentClass = '';
    const namespaceStack: string[] = [];
    const classStack: { name: string; depth: number }[] = [];
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track braces to know scope
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;

        // Namespace detection (simplified)
        const nsMatch = line.match(/^\s*namespace\s+([A-Za-z_.][\w.]*)\s*[\{;]?/);
        if (nsMatch && openBraces > 0) {
            namespaceStack.push(nsMatch[1]);
            currentNamespace = namespaceStack.join('.');
        }

        // Class detection
        const classMatch = line.match(CLASS_REGEX);
        if (classMatch) {
            const className = classMatch[1];
            classStack.push({ name: className, depth: braceDepth });
            currentClass = className;
            const range = new vscode.Range(i, 0, i, line.length);
            symbols.push({
                name: className,
                kind: vscode.SymbolKind.Class,
                uri,
                range,
                selectionRange: range,
                container: currentNamespace || undefined,
                language: 'csharp',
                detail: currentNamespace ? `${currentNamespace}.${className}` : className,
            });
        }

        // Method detection (avoid if/while/for/switch/foreach/catch)
        const methodMatch = line.match(METHOD_REGEX);
        if (methodMatch) {
            const methodName = methodMatch[1];
            if (!/^(if|while|for|switch|foreach|catch|using|lock|fixed)$/.test(methodName)) {
                const range = new vscode.Range(i, 0, i, line.length);
                symbols.push({
                    name: methodName,
                    kind: vscode.SymbolKind.Method,
                    uri,
                    range,
                    selectionRange: range,
                    container: currentClass || currentNamespace || undefined,
                    language: 'csharp',
                    detail: currentClass ? `${currentClass}.${methodName}` : methodName,
                });
            }
        }

        // Property detection
        const propMatch = line.match(PROPERTY_REGEX);
        if (propMatch) {
            const propName = propMatch[1];
            if (!/^(get|set|init|add|remove)$/.test(propName)) {
                const range = new vscode.Range(i, 0, i, line.length);
                symbols.push({
                    name: propName,
                    kind: vscode.SymbolKind.Property,
                    uri,
                    range,
                    selectionRange: range,
                    container: currentClass || undefined,
                    language: 'csharp',
                    detail: currentClass ? `${currentClass}.${propName}` : propName,
                });
            }
        }

        braceDepth += openBraces - closeBraces;

        // Pop class when closing brace
        while (classStack.length > 0 && braceDepth <= classStack[classStack.length - 1].depth) {
            classStack.pop();
            currentClass = classStack.length > 0 ? classStack[classStack.length - 1].name : '';
        }

        // Pop namespace
        if (namespaceStack.length > 0 && braceDepth < 0) {
            namespaceStack.pop();
            currentNamespace = namespaceStack.join('.') || '';
        }
    }

    return symbols;
}
