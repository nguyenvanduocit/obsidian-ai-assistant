import { ItemView, WorkspaceLeaf, Menu, Notice } from 'obsidian'
import SharePlugin from './main'
import { dequeue, onQueueAdded } from './queue'
import {createApp, reactive} from 'petite-vue'
export const VIEW_TYPE_AI_EXPLAIN = 'ai-assistant-view'
import {CreateApp} from './components/chat'
export class LeafView extends ItemView {
    private readonly plugin: SharePlugin
    private responseEl: HTMLElement
    private chatView: any;

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

    async processPrompt(instruction: string, model?: string) {
        let prompt = instruction
        const response = await this.plugin.createCompletion(prompt, model)
        if (!response) {
            new Notice('Failed to process prompt')
            return
        }

        this.responseEl.innerText = response
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
        return VIEW_TYPE_AI_EXPLAIN
    }

    getDisplayText(): string {
        return 'AI Assistant'
    }

    getIcon(): string {
        return 'ai-assistant'
    }
}
