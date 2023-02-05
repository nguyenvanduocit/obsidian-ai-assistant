import {App, Modal, Setting} from 'obsidian'

export class ModalOnBoarding extends Modal {
    constructor(
        app: App,
    ) {
        super(app)
    }

    onOpen() {
        const { contentEl } = this
        contentEl.createEl('h2', { text: 'Welcome to AI Assistant' })
        contentEl.createEl('p', {
            text: 'AiAssistant will support you in your daily note taking.'
        })
        contentEl.createEl('h2', {
                    text: 'AI Rename'
        })
        contentEl.createEl('iframe', {
            attr: {
                src: 'https://www.youtube.com/embed/0cWN_JhoZm4',
                width: '100%',
                height: '300px',
            }
        })

        contentEl.createEl('h2', {
                    text: 'AI Summarize and Explain'
        })
        contentEl.createEl('iframe', {
            attr: {
                src: 'https://www.youtube.com/embed/qU3DSY7eXA8',
                width: '100%',
                height: '300px',
            }
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
