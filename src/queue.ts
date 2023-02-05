const queue: Array<RequestMessage> = []
let onQueueAddedFn: () => void | undefined



export const enqueue = (item: RequestMessage) => {
    queue.push(item)

    if (onQueueAddedFn) {
        onQueueAddedFn()
    }
}

export const dequeue = () => {
    return queue.shift()
}

export const onQueueAdded = (callback: () => void) => {
    onQueueAddedFn = callback
}
