import { App, PluginSettingTab, Setting } from 'obsidian'
import AiAssistantPlugin from '../main'
import { createApiForm } from '../fns/createApiForm'
import { createHelpLinks } from '../fns/createHelpLinks'

export class SettingTab extends PluginSettingTab {
    plugin: AiAssistantPlugin
    shouldNotify: boolean

    constructor(app: App, plugin: AiAssistantPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        this.shouldNotify = false
        const { containerEl } = this
        containerEl.empty()

        createApiForm(containerEl, this.plugin)

        containerEl.createEl('hr')

        containerEl.createEl('h3', { text: 'Help' })

        createHelpLinks(containerEl)

        new Setting(containerEl)
            .setName('Follow me on Twitter')
            .setDesc('@duocdev')
            .addButton((button) => {
                button.setCta()
                button.setButtonText('Follow for update').onClick(() => {
                    window.open('https://twitter.com/duocdev')
                })
            })
            .addButton((button) => {
                button.buttonEl.outerHTML =
                    "<a href='https://paypal.me/duocnguyen' target='_blank'><img style='border:0px;height:35px;' src='https://cdn.ko-fi.com/cdn/kofi3.png?v=3' /></a>"
            })
    }
}
