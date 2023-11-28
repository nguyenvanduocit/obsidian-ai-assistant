import {addIcon, Editor, MarkdownFileInfo, MarkdownView, Menu, Notice, Plugin, Point, TFile} from 'obsidian'
import {SettingTab} from './components/SetingTab'
import {ModalOnBoarding} from './components/ModalOnboarding'
import {openView} from './fns/openView'
import {enqueue} from './queue'
import {ChatView, VIEW_TYPE_CHAT} from './components/ChatView'
import {ModalLoading} from './components/ModalLoading'
import OpenAI from "openai";
import {getOpenaiClient} from "./services/apiClient";
import {CanvasNode, WorkspaceWithCanvas} from "./extends/canvas/types";

interface PluginSetting {
    isFirstRun: boolean
    openaiApiKey: string
    temperature: number
    model: string
    explainTemplate: string
    summarizeTemplate: string
    fixWritingTemplate: string
    makeShorter: string
    makeLonger: string
}

const DEFAULT_SETTINGS: Partial<PluginSetting> = {
    isFirstRun: true,
    openaiApiKey: '',
    temperature: 0.5,
    model: 'gpt-3.5-turbo',
    explainTemplate: `explain:\n\n"""\n{text}\n"""`,
    summarizeTemplate: `{text}\n\nTl;dr`,
    fixWritingTemplate: `Correct this to standard English: \n\n"""\n{text}\n"""`,
    makeShorter: `Make this paragraph shorter: \n\n"""\n{text}\n"""`,
    makeLonger: `Make this paragraph longer: \n\n"""\n{text}\n"""`
}

export default class AiAssistantPlugin extends Plugin {
    private loadingModal: ModalLoading | null = null
    private openai: OpenAI | null = null
    private statusBarItem: HTMLElement | null = null

    getOpenaiClient(): OpenAI {
        if (this.settings.openaiApiKey === '') {
            new Notice('Please set OpenAI API key')
            throw new Error('Please set OpenAI API key')
        }
        if (!this.openai) {
            this.openai = getOpenaiClient(this.settings.openaiApiKey)
        }

        return this.openai
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
            this.updateStatusBar('Please set OpenAI API key')
        }

        this.addSettingTab(new SettingTab(this.app, this))

        this.registerView(VIEW_TYPE_CHAT, (leaf) => {
            return new ChatView(leaf, this)
        })

        this.setupIcon()
        this.setupCommands()
        this.setupFileMenu()
        this.setupEditorMenu()
        this.setupCanvasMenu()
    }

    setupIcon() {
        addIcon(
            'ai-assistant',
            `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`
        )

        this.addRibbonIcon('ai-assistant', 'AI Assistant', async () => {
            await openView(this.app.workspace, VIEW_TYPE_CHAT)
        })
    }

    setupEditorMenu() {
        this.registerEvent(this.app.workspace.on('editor-menu', this.setupEditorMenuEvents.bind(this)))
    }

    setupCanvasMenu() {
        const workspace = this.app.workspace as unknown as WorkspaceWithCanvas;

        this.registerEvent(
            workspace.on('canvas:node-menu', (menu: Menu, node: CanvasNode) => {
                menu.addSeparator();
                menu.addItem((item) =>
                    item
                        .setTitle('Copy style')
                        .setSection('extra')
                        .onClick(() => {
                            // Some node action
                        })
                );
            })
        );
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CHAT)
    }

    showLoadingModal() {
        if (this.loadingModal === null) {
            this.loadingModal = new ModalLoading(this.app)
        }

        this.loadingModal.open()
    }

    hideLoadingModal() {
        if (this.loadingModal !== null) {
            this.loadingModal.forceClose()
        }
    }

    setupCommands() {
        this.addCommand({
            id: 'complete',
            name: 'Complete',
            editorCallback: async (editor: Editor) => {
                await this.aiComplete(editor)
            }
        })

        this.addCommand({
            id: 'rename-file',
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

    async openRightView(instruction: string, model?: string) {
        enqueue(instruction)
        await openView(this.app.workspace, VIEW_TYPE_CHAT)
    }

    setupEditorMenuEvents(menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) {


        const selection = editor.getSelection().trim()

        if (selection === '') {
            menu.addItem((item) => {
                item.setTitle('AI complete').onClick(async () => {
                    await this.aiComplete(editor)
                })
            })
        }

        menu.addItem((item) => {
            item.setTitle('AI translate').onClick(
                async () => {
                    this.showLoadingModal()
                    const translated = await this.translate(selection)
                    if (translated) {
                        editor.replaceSelection(translated)
                    }
                    this.hideLoadingModal()
                }
            )
        })

        menu.addItem((item) => {
            item.setTitle('AI explain').onClick(async () => {
                await this.openRightView(
                    this.settings.explainTemplate.replace(
                        '{text}',
                        selection
                    )
                )
            })
        })

        menu.addItem((item) => {
            item.setTitle('AI fix spelling & grammar').onClick(
                async () => {
                    await this.openRightView(
                        this.settings.fixWritingTemplate.replace(
                            '{text}',
                            selection
                        )
                    )
                }
            )
        })

        menu.addItem((item) => {
            item.setTitle('AI make shorter').onClick(async () => {
                await this.openRightView(
                    this.settings.makeShorter.replace(
                        '{text}',
                        selection
                    )
                )
            })
        })

        menu.addItem((item) => {
            item.setTitle('AI make longer').onClick(async () => {

                await this.openRightView(
                    this.settings.makeLonger.replace(
                        '{text}',
                        selection
                    )
                )
            })
        })

        if (editor.getSelection().split(' ').length > 10) {
            menu.addItem((item) => {
                item.setTitle('AI summarize').onClick(async () => {
                    await this.openRightView(
                        this.settings.summarizeTemplate.replace(
                            '{text}',
                            selection
                        )
                    )
                })
            })
        }
    }

    // use openai to complete text, then replace selection
    async aiComplete(editor: Editor) {
        const cursor = editor.getCursor()
        const line = editor.getLine(cursor.line)

        this.showLoadingModal()
        let content: string | null

        if (line.trim() === '') {
            content = await this.createCompletion(
                'continue write this:' + editor.getValue()
            )
        } else {
            const text = line.substring(0, cursor.ch)
            content = await this.createCompletion('continue write this:' + text)
        }

        if (content) {
            editor.replaceSelection(content)
        }

        this.hideLoadingModal()
    }

    async aiRenameFile(file: TFile) {
        this.showLoadingModal()

        let fileContent = await this.app.vault.read(file)

        new Notice('Generating file name...')
        // update status bar
        const prompt =
            `Write short title for this note, follow best practice, straightforward, do not use special characters: \n\n` + fileContent + `\n\n`

        let fileName = await this.createCompletion(prompt)
        if (!fileName) {
            new Notice('Cannot generate file name')
            return
        }

        // trim " and '
        fileName = fileName.replace(/^['"]/, '').replace(/['"]$/, '')
        if (!fileName) {
            new Notice('Cannot generate file name')
            return
        }
        // obsidian rename file
        const newFilePath = file.path.replace(file.basename, fileName)
        await this.app.vault.rename(file, newFilePath)
        new Notice('File renamed')

        this.hideLoadingModal()
    }

    async createCompletion(
        prompt: string,
    ): Promise<string | null> {
        const client = getOpenaiClient(this.settings.openaiApiKey)
        const runner = client.beta.chat.completions
            .stream({
                model: this.settings.model,
                messages: [{role: 'user', content: prompt}],
            })

        const result = await runner.finalChatCompletion();

        return result.choices[0].message.content
    }

    // status bar
    updateStatusBar(text: string) {
        if (this.statusBarItem === null) {
            this.statusBarItem = this.addStatusBarItem()
        }

        this.statusBarItem.innerText = text
    }

    clearStatusBarItem() {
        if (this.statusBarItem && this.statusBarItem.innerText !== '') {
            this.statusBarItem.innerText = ''
        }
    }

    // settings
    settings: PluginSetting

    async loadSettings() {
        this.settings = await this.loadData()
        // merge default settings
        this.settings = Object.assign({}, DEFAULT_SETTINGS, this.settings)
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }

    private async translate(text: string): Promise<string | null> {
        const client = getOpenaiClient(this.settings.openaiApiKey);
        const runner = client.beta.chat.completions.stream({
            model: this.settings.model,
            messages: [{
                role: 'system',
                content: 'You are a interpreter, when user say something in English, you translate it to Vietnamese and vice versa.'
            },
                {role: 'user', content: `${text}`}],
        });

        const result = await runner.finalChatCompletion();

        return result.choices[0].message.content;
    }
}
