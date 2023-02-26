import { Configuration, OpenAIApi } from 'openai'

let apiClient: OpenAIApi | null = null

export const getOpenaiClient = (openaiApiKey: string) => {
    if (!apiClient) {
        const configuration = new Configuration({
            apiKey: openaiApiKey
        })

        apiClient = new OpenAIApi(configuration)
    }

    return apiClient
}
