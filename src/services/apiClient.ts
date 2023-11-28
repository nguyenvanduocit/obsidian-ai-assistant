import OpenAI, {ClientOptions} from "openai";


let apiClient: OpenAI | null = null

export const getOpenaiClient = (openaiApiKey: string): OpenAI => {

    if (!apiClient) {
        const configuration = {
            apiKey: openaiApiKey,
            dangerouslyAllowBrowser: true
        } as ClientOptions

        apiClient = new OpenAI(configuration)
    }

    return apiClient
}

