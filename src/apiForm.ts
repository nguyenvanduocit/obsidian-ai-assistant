import AiAssistantPlugin from './main'
import { Notice, Setting } from 'obsidian'

export const createApiForm = (
    containerEl: HTMLElement,
    plugin: AiAssistantPlugin
) => {
    let apiKey = plugin.settings.openaiApiKey
    let temperature = plugin.settings.temperature

    new Setting(containerEl)
        .setName('OpenAI API Key')
        .setDesc(
            'You can get your API key from https://beta.openai.com/account/api-keys'
        )
        .addText((text) =>
            text
                .setValue(plugin.settings.openaiApiKey)
                .onChange(async (value) => {
                    apiKey = value
                })
        )

    // temperature
    new Setting(containerEl)
        .setName('Temperature')
        .setDesc(
            'The temperature of the model. Higher values will make the model more creative and generate more surprising results, but also more mistakes. Try 0.9 for more creative results and 0 for more conservative results.'
        )
        .addSlider((slider) =>
            slider
                .setLimits(0, 1, 0.1)
                .setValue(plugin.settings.temperature)
                .onChange(async (value) => {
                    temperature = value
                })
        )

    // save button
    new Setting(containerEl).addButton((button) => {
        button.setButtonText('Save settings').onClick(async () => {
            plugin.settings.openaiApiKey = apiKey
            plugin.settings.temperature = temperature

            await plugin.saveSettings()
            new Notice('AI Assistant settings saved.')
        })
    })
}
