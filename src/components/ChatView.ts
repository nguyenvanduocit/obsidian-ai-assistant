import { ItemView, WorkspaceLeaf, Menu, Notice } from 'obsidian'
import SharePlugin from '../main'
export const VIEW_TYPE_CHAT = 'ai-assistant-chat-view'
import { CreateApp } from './chat'
export class ChatView extends ItemView {
    private readonly plugin: SharePlugin
    private responseEl: HTMLElement
    private chatView: any

    constructor(leaf: WorkspaceLeaf, plugin: SharePlugin) {
        super(leaf)
        this.plugin = plugin
    }

    async onload(): Promise<void> {
        this.renderView()
        this.chatView = CreateApp(this.responseEl, this.plugin)
    }

    renderView(): void {
        this.contentEl.empty()
        this.contentEl.addClass('ai-assistant-view')

        this.responseEl = this.contentEl.createEl('div', {
            cls: 'ai-assistant--container'
        })
    }

    onunload() {
        super.onunload()
    }

    onPaneMenu(menu: Menu, source: string): void {
        super.onPaneMenu(menu, source)
        menu.addItem((item) => {
            item.setTitle('Help...')
            item.setIcon('globe')
            item.onClick(() => {
                open('https://twitter.com/duocdev')
            })
        })
    }

    getViewType(): string {
        return VIEW_TYPE_CHAT
    }

    getDisplayText(): string {
        return 'AI Assistant'
    }

    getIcon(): string {
        return 'ai-assistant'
    }
}
