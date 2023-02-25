import {
    addIcon,
    Editor,
    EditorPosition,
    Menu,
    Notice,
    Plugin,
    TFile
} from 'obsidian'
import { SettingTab } from './SetingTab'
import { ModalOnBoarding } from './ModalOnboarding'
import { Configuration, OpenAIApi } from 'openai'
import { openView } from './openView'
import { enqueue } from './queue'
import { CanvasView, VIEW_TYPE_AI_EXPLAIN } from './CanvasView'
// @ts-ignore-next-line
import logo from './logo.svg?raw'
import { ModalLoading } from './ModalLoading'

interface PluginSetting {
    isFirstRun: boolean
    openaiApiKey: string
    temperature: number
    explainTemplate: string
    summarizeTemplate: string
}

const DEFAULT_SETTINGS: Partial<PluginSetting> = {
    isFirstRun: true,
    openaiApiKey: '',
    temperature: 0.5,
    explainTemplate: `explain:\n\n"""\n{text}\n"""`,
    summarizeTemplate: `{text}\n\nTl;dr`
}

export default class AiAssistantPlugin extends Plugin {
    settings: PluginSetting
    statusBarItem: HTMLElement | null = null
    loadingModal: ModalLoading | null = null
    getOpenaiClient() {
        const configuration = new Configuration({
            apiKey: this.settings.openaiApiKey
        })

        return new OpenAIApi(configuration)
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

        // onboarding
        if (this.settings.isFirstRun) {
            new ModalOnBoarding(this.app).open()

            this.settings.isFirstRun = false
            await this.saveSettings()
        }

        // check if api key is set
        if (!this.settings.openaiApiKey) {
            this.updateStatusBarItem('Please set OpenAI API key')
        }

        this.addSettingTab(new SettingTab(this.app, this))

        this.addRibbonIcon('ai-assistant', 'AI Assistant', async () => {
            await openView(this.app.workspace, VIEW_TYPE_AI_EXPLAIN)
        })

        // prepare icons
        addIcon(
            'ai-assistant',
            `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke="var()" d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`
        )
        this.registerView(VIEW_TYPE_AI_EXPLAIN, (leaf) => {
            return new CanvasView(leaf, this)
        })

        this.setupFileMenu()
        this.setupEditorMenu()
        this.setupCommands()
    }

    showLoadingModal() {
        if (this.loadingModal === null) {
            this.loadingModal = new ModalLoading(this.app)
        }

        this.loadingModal.open()
    }

    hideLoadingModal() {
        if (this.loadingModal !== null) {
            this.loadingModal.close()
        }
    }

    setupCommands() {
        this.addCommand({
            id: 'ai-assistant-complete',
            name: 'Complete',
            editorCallback: async (editor: Editor) => {
                await this.aiComplete(editor)
            }
        })

        this.addCommand({
            id: 'ai-assistant-rename-file',
            name: 'Rename file',
            editorCallback: async (editor: Editor) => {
                await this.aiRenameFile(
                    this.app.workspace.getActiveFile() as TFile
                )
            }
        })
    }

    setupFileMenu() {
        // file rename
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                menu.addItem((item) => {
                    item.setTitle('AI Rename')
                        .setIcon('document')
                        .onClick(async () => {
                            try {
                                await this.aiRenameFile(file as TFile)
                            } catch (e) {
                                this.clearStatusBarItem()
                                new Notice('Error: ' + e)
                            }
                        })
                })
            })
        )
    }

    setupEditorMenu() {
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu, editor, view) => {
                const summary = async (instruction: string) => {
                    enqueue({
                        prompt: instruction
                    })
                    await openView(this.app.workspace, VIEW_TYPE_AI_EXPLAIN)
                }

                const selection = editor.getSelection().trim()

                if (selection !== '') {
                    menu.addItem((item) => {
                        item.setTitle('AI explain').onClick(async () => {
                            await summary(
                                this.settings.explainTemplate.replace(
                                    '{text}',
                                    selection
                                )
                            )
                        })
                    })

                    if (editor.getSelection().split(' ').length > 10) {
                        menu.addItem((item) => {
                            item.setTitle('AI summarize').onClick(async () => {
                                await summary(
                                    this.settings.summarizeTemplate.replace(
                                        '{text}',
                                        selection
                                    )
                                )
                            })
                        })
                    }
                }

                if (editor.getSelection().trim() === '') {
                    menu.addItem((item) => {
                        item.setTitle('AI complete').onClick(async () => {
                            await this.aiComplete(editor)
                        })
                    })
                }
            })
        )
    }

    async aiComplete(editor: Editor) {
        const cursor = editor.getCursor()
        const line = editor.getLine(cursor.line)

        this.showLoadingModal()
        let content = ''

        if (line.trim() === '') {
            content = await this.processPrompt(editor.getValue())
        } else {
            const text = line.substring(0, cursor.ch)
            content = await this.processPrompt(text)
        }
        editor.replaceSelection(content)
        this.hideLoadingModal()
    }

    async aiRenameFile(file: TFile) {
        let fileContent = await this.app.vault.read(file)

        new Notice('Generating file name...')
        // update status bar
        const prompt =
            `write short title for this markdown note, (no quote): \n"""\n` +
            fileContent +
            `\n"""`

        const fileName = await this.processPrompt(prompt)
        if (!fileName) {
            new Notice('Cannot generate file name')
            return
        }
        // obsidian rename file
        const newFilePath = file.path.replace(file.basename, fileName)
        await this.app.vault.rename(file, newFilePath)
        new Notice('File renamed')
    }

    async processPrompt(prompt: string, stop?: string): Promise<string> {
        this.updateStatusBarItem('Generating response...')
        const client = this.getOpenaiClient()

        const response = await client.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
            temperature: this.settings.temperature,
            max_tokens: 1000,
            stop: stop
        })

        this.clearStatusBarItem()

        if (!response.data.choices) {
            return ''
        }

        if (response.data.choices.length === 0) {
            return ''
        }

        if (!response.data.choices[0].text) {
            return ''
        }

        // trim new line
        return response.data.choices[0].text.trim()
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_AI_EXPLAIN)
    }

    async loadSettings() {
        this.settings = await this.loadData()

        // merge default settings
        this.settings = Object.assign({}, DEFAULT_SETTINGS, this.settings)
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }
}
