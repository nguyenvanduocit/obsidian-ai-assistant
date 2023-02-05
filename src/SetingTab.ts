import { App, PluginSettingTab, Setting } from 'obsidian'
import AiAssistantPlugin from './main'
import {createApiForm} from "./apiForm";

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

        const settingContainerEl = containerEl.createDiv('setting-container')

        containerEl.createEl('h3', { text: 'Help' })

        containerEl.createEl('small', {
            attr: {
                style: 'display: block; margin-bottom: 5px'
            },
            text: 'When delete or edit a gate, you need to reload Obsidian to see the changes.'
        })

        containerEl.createEl('small', {
            attr: {
                style: 'display: block; margin-bottom: 1em;'
            },
            text: `To reload Obsidian, you can use the menu "view -> Force reload" or "Reload App" in the command palette.`
        })

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
