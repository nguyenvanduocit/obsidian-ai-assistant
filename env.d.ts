declare type FramePosition = 'left' | 'center' | 'right'

declare interface RequestMessage {
    prompt: string
    model?: string
}
