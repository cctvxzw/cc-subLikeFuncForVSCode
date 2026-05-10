import * as vscode from 'vscode';
import { SymbolIndex } from './symbolIndex';
import { parseLuaDocument } from './luaParser';
import { parseCSharpDocument } from './csharpParser';
import { getConfig, SearchConfig } from '../utils/config';

export class IndexService {
    private index = new SymbolIndex();
    private watchers: vscode.FileSystemWatcher[] = [];
    private outputChannel: vscode.OutputChannel;
    private debounceTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Sublime Search');
    }

    async buildIndex(): Promise<void> {
        const config = getConfig();
        this.index.clear();

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Window,
                title: 'Sublime Search: Indexing symbols...',
            },
            async (progress) => {
                const luaFiles = await vscode.workspace.findFiles(
                    config.luaInclude.length > 0 ? config.luaInclude[0] : '**/*.lua',
                    `{${config.luaExclude.join(',')}}`
                );
                const total = luaFiles.length + (config.enableCSharp ? 1 : 0);
                let processed = 0;

                for (const file of luaFiles) {
                    await this.indexFile(file, config);
                    processed++;
                    progress.report({ message: `${processed}/${total}` });
                }

                if (config.enableCSharp) {
                    const csFiles = await vscode.workspace.findFiles(
                        config.csharpInclude.length > 0 ? config.csharpInclude[0] : '**/*.cs',
                        `{${config.csharpExclude.join(',')}}`
                    );
                    for (const file of csFiles) {
                        await this.indexFile(file, config);
                        processed++;
                    }
                    progress.report({ message: `${processed}/${total + csFiles.length - 1}` });
                }

                this.log(`Indexed ${this.index.getFileCount()} files`);
            }
        );
    }

    async indexFile(uri: vscode.Uri, _config?: SearchConfig): Promise<void> {
        const ext = uri.path.split('.').pop()?.toLowerCase();

        if (ext !== 'lua' && ext !== 'cs') {
            return;
        }

        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const text = new TextDecoder('utf-8').decode(content);
            const symbols = ext === 'lua'
                ? parseLuaDocument(uri, text)
                : parseCSharpDocument(uri, text);
            this.index.addOrUpdate(uri, symbols);
        } catch (err) {
            this.log(`Failed to index ${uri.fsPath}: ${err}`);
        }
    }

    removeFile(uri: vscode.Uri): void {
        this.index.remove(uri);
    }

    getIndex(): SymbolIndex {
        return this.index;
    }

    setupWatchers(): vscode.Disposable {
        this.disposeWatchers();
        const config = getConfig();
        const disposables: vscode.Disposable[] = [];

        const luaWatcher = vscode.workspace.createFileSystemWatcher(
            config.luaInclude.length > 0 ? config.luaInclude[0] : '**/*.lua'
        );
        disposables.push(
            luaWatcher.onDidCreate((uri) => this.debounceUpdate(uri)),
            luaWatcher.onDidChange((uri) => this.debounceUpdate(uri)),
            luaWatcher.onDidDelete((uri) => this.index.remove(uri))
        );
        this.watchers.push(luaWatcher);

        if (config.enableCSharp) {
            const csWatcher = vscode.workspace.createFileSystemWatcher(
                config.csharpInclude.length > 0 ? config.csharpInclude[0] : '**/*.cs'
            );
            disposables.push(
                csWatcher.onDidCreate((uri) => this.debounceUpdate(uri)),
                csWatcher.onDidChange((uri) => this.debounceUpdate(uri)),
                csWatcher.onDidDelete((uri) => this.index.remove(uri))
            );
            this.watchers.push(csWatcher);
        }

        return vscode.Disposable.from(...disposables);
    }

    disposeWatchers(): void {
        for (const w of this.watchers) {
            w.dispose();
        }
        this.watchers = [];
    }

    dispose(): void {
        this.disposeWatchers();
        this.outputChannel.dispose();
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }

    private debounceUpdate(uri: vscode.Uri): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.indexFile(uri);
        }, 200);
    }

    private matchesGlobs(uri: vscode.Uri, include: string[], exclude: string[]): boolean {
        const relativePath = vscode.workspace.asRelativePath(uri);
        // Simple check: if it's in the include patterns and not in exclude
        const isIncluded = include.some((pattern) =>
            this.minimatch(relativePath, pattern)
        );
        if (!isIncluded) { return false; }
        const isExcluded = exclude.some((pattern) =>
            this.minimatch(relativePath, pattern)
        );
        return !isExcluded;
    }

    private minimatch(path: string, pattern: string): boolean {
        // Very simplified glob matching for common patterns
        const regex = pattern
            .replace(/\*\*/g, '{{GLOBSTAR}}')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.')
            .replace(/{{GLOBSTAR}}/g, '.*');
        const re = new RegExp(regex);
        return re.test(path);
    }

    private log(message: string): void {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }
}
