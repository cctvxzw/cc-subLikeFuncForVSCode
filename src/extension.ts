import * as vscode from 'vscode';
import { IndexService } from './index/indexService';
import { LuaDocumentSymbolProvider } from './providers/luaDocumentSymbolProvider';
import { LuaWorkspaceSymbolProvider } from './providers/luaWorkspaceSymbolProvider';
import { LuaDefinitionProvider } from './providers/luaDefinitionProvider';
import { LuaHoverProvider } from './providers/luaHoverProvider';
import { getConfig, onConfigChange } from './utils/config';

let indexService: IndexService;

export function activate(context: vscode.ExtensionContext): void {
    indexService = new IndexService();

    const index = indexService.getIndex();
    const luaSelector: vscode.DocumentSelector = { language: 'lua' };

    // Register providers
    const docProvider = new LuaDocumentSymbolProvider(index);
    const wsProvider = new LuaWorkspaceSymbolProvider(index);
    const defProvider = new LuaDefinitionProvider(index);
    const hoverProvider = new LuaHoverProvider(index);

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(luaSelector, docProvider)
    );
    context.subscriptions.push(
        vscode.languages.registerWorkspaceSymbolProvider(wsProvider)
    );
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(luaSelector, defProvider)
    );
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(luaSelector, hoverProvider)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('sublimeSearch.searchWorkspaceSymbols', async () => {
            await vscode.commands.executeCommand('workbench.action.showAllSymbols');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sublimeSearch.searchDocumentSymbols', async () => {
            await vscode.commands.executeCommand('workbench.action.gotoSymbol');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sublimeSearch.rebuildIndex', async () => {
            await indexService.buildIndex();
            vscode.window.showInformationMessage('Sublime Search: Index rebuilt');
        })
    );

    // Setup file watchers
    context.subscriptions.push(indexService.setupWatchers());

    // Build index on startup if enabled
    const config = getConfig();
    if (config.indexOnStartup) {
        indexService.buildIndex().catch((err) => {
            console.error('Failed to build index:', err);
        });
    }

    // Listen for config changes
    context.subscriptions.push(
        onConfigChange(() => {
            indexService.disposeWatchers();
            context.subscriptions.push(indexService.setupWatchers());
            indexService.buildIndex().catch((err) => {
                console.error('Failed to rebuild index after config change:', err);
            });
        })
    );

    context.subscriptions.push(indexService);
}

export function deactivate(): void {
    if (indexService) {
        indexService.dispose();
    }
}
