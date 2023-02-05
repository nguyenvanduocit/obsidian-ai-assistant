import { ItemView, WorkspaceLeaf, Menu, Notice } from 'obsidian'
import SharePlugin from './main'
import { dequeue, onQueueAdded } from './queue'

export const ViewType = 'ai-assistant-view'

export class CanvasView extends ItemView {
    private plugin: SharePlugin
    private responseEl: HTMLElement

    constructor(leaf: WorkspaceLeaf, plugin: SharePlugin) {
        super(leaf)
        this.plugin = plugin
    }

    async onload(): Promise<void> {
        this.contentEl.empty()
        this.contentEl.addClass('ai-assistant-view')

        this.responseEl = this.contentEl.createEl('div', {
            cls: 'ai-assistant-response',
            attr: {
                contenteditable: 'true'
            }
        })

        this.responseEl.innerText =
            'To get started, select some text and press right-click > AI Assistant'

        await this.processQueue()

        onQueueAdded(async () => {
            await this.processQueue()
        })
    }

    async processQueue() {
        const queuedText = dequeue()
        if (queuedText) {
            this.responseEl.innerText = 'Processing...'
            await this.processPrompt(queuedText.prompt)
        }
    }

    async processPrompt(instruction: string) {
        let prompt = instruction
        const response = await this.plugin.processPrompt(prompt)
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
        return ViewType
    }

    getDisplayText(): string {
        return 'AI Assistant'
    }

    getIcon(): string {
        return 'ai-assistant'
    }
}
