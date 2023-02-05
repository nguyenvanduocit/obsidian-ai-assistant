import { App, Modal, Setting } from 'obsidian'
import { createHelpLinks } from './helpLinks'

export class ModalOnBoarding extends Modal {
    constructor(app: App) {
        super(app)
    }

    onOpen() {
        const { contentEl } = this
        contentEl.createEl('h2', { text: 'Welcome to AI Assistant' })
        contentEl.createEl('p', {
            text: 'Before you start, take a look at the video below to see how it works.'
        })

        createHelpLinks(contentEl)

        contentEl.createEl('p', {
            text: 'After that, please set your OpenAI API key in the plugin settings.'
        })

        // add twitter link
        contentEl
            .createEl('p', {
                text: 'If you get any issues, please let me know on Twitter '
            })
            .createEl('a', {
                text: '@duocdev',
                cls: 'mod-cta',
                href: 'https://twitter.com/duocdev'
            })
    }

    onClose() {
        const { contentEl } = this
        contentEl.empty()
    }
}
