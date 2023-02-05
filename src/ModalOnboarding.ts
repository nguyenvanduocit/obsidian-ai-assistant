import {App, Modal, Setting} from 'obsidian'

export class ModalOnBoarding extends Modal {
    constructor(
        app: App,
    ) {
        super(app)
    }

    onOpen() {
        const { contentEl } = this
        contentEl.createEl('h3', { text: 'Welcome to AI Assistant' })
        contentEl.createEl('p', {
            text: 'AiAssistant will support you in your daily note taking.'
        })
        contentEl.createEl('p', {
            text: 'But now you have to provide OpenAI API key in the setting tab.'
        })
    }

    onClose() {
        const { contentEl } = this
        contentEl.empty()
    }
}
