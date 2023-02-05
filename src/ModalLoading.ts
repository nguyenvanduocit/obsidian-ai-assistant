import { App, Modal, Setting } from 'obsidian'

export class ModalLoading extends Modal {
    constructor(app: App) {
        super(app)

        this.modalEl.addClass('ai-assistant-modal-loading')

        const { contentEl } = this
        contentEl.createEl('div', {
            text: 'AI Assistant is processing',
            cls: 'center'
        })
    }
}
