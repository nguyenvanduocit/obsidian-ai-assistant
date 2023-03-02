
import { createApp, nextTick } from "petite-vue";
import SharePlugin from "../main";
import { dequeue, onQueueAdded } from "../queue";

const template = `
<div @vue:mounted="mounted" class="ai-assistant--messages">
  <div v-for="message in messages" :class="message.role" class="ai-assistant--message">
    <div class="ai-assistant--message-content" :contenteditable="message.role === 'assistant'" v-html="message.content"></div>
  </div>
  <div v-if="loadingMessage" class="ai-assistant--message-content">{{loadingMessage}}</div>
</div>

<div class="ai-assistant--input">
    <div class="ai-assistant--input-text" contenteditable tabindex="1" autofocus @keydown.enter="onEnter"></div>
    <button :disabled="messages.length === 0" @click="regenerate">Regenerate</button>
</div>
`

const loadingMessages = [
  'Thinking...',
  'Processing...',
  'Wait a second...',
  'I\'m working on it...',
  'Loading... almost there!',
  'I\'m brewing up some fresh responses, just for you!',
]

export const CreateApp = (el: HTMLElement, plugin: SharePlugin) => {
  el.innerHTML = template
  const app = createApp({
    messages: Array<Message>(),
    currentMessage: '',
    loadingMessage: '',

    mounted() {
      this.processQueue()
      onQueueAdded(async () => {
        await this.processQueue()
      })
    },

    async regenerate() {
      this.messages.pop()
      const response = await plugin.createCompletion(this.messages)
      this.messages.push({ role: 'assistant', content: response })

      await this.scrollToBottom()
    },

    async processQueue() {
      const queuedText = dequeue()
      if (queuedText) {
        this.currentMessage = queuedText
        await this.processRequest()
      }
    },

    async onEnter(e: Event) {
      const target = e.target as HTMLElement
      if (target.innerText.trim() === '') {
        return
      }
      // check if shift is pressed
      if (e && e.shiftKey) {
        return
      }
      e.preventDefault()

      this.currentMessage = target.innerText.trim()
      target.innerText = ''

      await this.processRequest()
    },

    async processRequest() {
      this.messages.push({ role: 'user', content: this.currentMessage })
      this.currentMessage = ''
      await this.scrollToBottom()

      this.loadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
      const response = await plugin.createCompletion(this.messages)
      this.messages.push({ role: 'assistant', content: response })
      await this.scrollToBottom()

      this.loadingMessage = ''
    }
    ,
    async scrollToBottom() {
      await nextTick(() => {
        // scroll to the last message
        const messages = el.querySelector('.ai-assistant--messages')
        if (messages) {
          messages.scrollTop = messages.scrollHeight
        }
      })
    }
  })

  app.mount(el)

  return app
}
