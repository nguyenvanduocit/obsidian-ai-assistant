import {Menu, Notice, Plugin, TFile} from 'obsidian'
import { SettingTab } from './SetingTab'
import { ModalOnBoarding } from './ModalOnboarding'
import {Configuration, OpenAIApi} from "openai";

interface PluginSetting {
    isFirstRun: boolean
    openaiApiKey: string
    temperature: number
    gates: Record<string, GateFrameOption>
}

const DEFAULT_SETTINGS: PluginSetting = {
    isFirstRun: true,
    openaiApiKey: '',
    temperature: 0.5,
    gates: {}
}

export default class AiAssistantPlugin extends Plugin {
    settings: PluginSetting
    statusBarItem: HTMLElement | null = null
    getOpenaiClient () {

        const configuration = new Configuration({
            apiKey: this.settings.openaiApiKey,
        });

        return new OpenAIApi(configuration);

    }

    updateStatusBarItem(text: string) {
        if (!this.statusBarItem) {
            this.statusBarItem = this.addStatusBarItem()
        }
        this.statusBarItem.innerText = text
    }

    clearStatusBarItem() {
        if (this.statusBarItem && this.statusBarItem.innerText !== '') {
            this.statusBarItem.innerText = ''
        }
    }

    async onload() {
        await this.loadSettings()

        if (this.settings.isFirstRun) {
            new ModalOnBoarding(
                this.app
            ).open()

            this.settings.isFirstRun = false
            await this.saveSettings()
        }

        if (!this.settings.openaiApiKey) {
            this.updateStatusBarItem('Please set OpenAI API key')
        }

        this.addSettingTab(new SettingTab(this.app, this))

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                menu.addItem((item) => {
                    item
                        .setTitle("AI Rename")
                        .setIcon("document")
                        .onClick(async () => {
                            try {
                                await this.aiRenameFile(file as TFile)
                            } catch (e) {
                                this.clearStatusBarItem()
                                new Notice('Error: ' + e)
                            }
                        })

                });
            })
        );
    }

    async aiRenameFile(file: TFile) {
        let fileContent = await this.app.vault.read(file)

        new Notice('Generating file name...')
        // update status bar
        this.updateStatusBarItem('Generating file name...')
        const fileName = await this.generateFileName(fileContent)
        if (!fileName) {
            new Notice('Cannot generate file name')
            return
        }
        this.clearStatusBarItem()
        // obsidian rename file
        const newFilePath = file.path.replace(file.basename, fileName)
        await this.app.vault.rename(file, newFilePath)
        new Notice('File renamed')
    }

    async generateFileName(fileContent: string): Promise<string> {
        const client = this.getOpenaiClient();

        const prompt = `write short title for this markdown note, (no quote): \n"""\n` + fileContent + `\n"""`;
        const response = await client.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: this.settings.temperature,
            max_tokens: 50,
        });

        if (!response.data.choices) {
            return ''
        }

        if (response.data.choices.length === 0) {
            return ''
        }

        if (!response.data.choices[0].text) {
            return ''
        }
        // remove quote
        
        return response.data.choices[0].text.trim()
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = await this.loadData()

        if (!this.settings) {
            this.settings = DEFAULT_SETTINGS
        }
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }
}
