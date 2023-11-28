import { App, Modal, Setting } from 'obsidian'

export class ModalLoading extends Modal {
    constructor(app: App) {
        super(app)

        this.modalEl.addClass('ai-assistant-modal-loading')

        const { contentEl } = this
        contentEl.createEl('div', {
            text: 'AI Assistant is processing, to ensure the selected text is correct, we have to block the UI. Please wait a few seconds...',
            cls: 'center'
        })
    }
    close() {

    }

    forceClose() {
        super.close()
    }
}
