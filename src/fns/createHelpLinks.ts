export const createHelpLinks = (containerEl: HTMLElement) => {
    const helpContainerEl = containerEl.createDiv('help-container')
    helpContainerEl.createEl('a', {
        attr: {
            style: 'display:block',
            href: 'https://youtu.be/0cWN_JhoZm4'
        },
        text: `AI file rename`
    })

    helpContainerEl.createEl('a', {
        attr: {
            style: 'display:block',
            href: 'https://www.youtube.com/watch?v=qU3DSY7eXA8&ab_channel=fridayDeployment'
        },
        text: `Summarize text`
    })

    helpContainerEl.createEl('a', {
        attr: {
            style: 'display:block',
            href: 'https://www.youtube.com/watch?v=qU3DSY7eXA8&ab_channel=fridayDeployment'
        },
        text: `Explain`
    })
}
