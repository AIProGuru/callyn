export interface ApiAgent {
    id: string,
    user_id?: string,
    assistant_id?: string,
    name: string,
    voice: string,
    model: string,
    instructions?: string,
    timestamp?: string
}