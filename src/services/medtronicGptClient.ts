export const MEDTRONIC_GPT_RESPONSES_URL =
  "https://api.gpt.medtronic.com/providers/openai/v1/responses"

export interface MedtronicGptConfig {
  baseUrl?: string
  model: string
  token: string
}

export interface SendMessageOptions {
  instructions?: string
  fetchFn?: typeof fetch
}

export interface MedtronicGptResult {
  reply: string
  responseId?: string
}

export class MedtronicGptApiError extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = "MedtronicGptApiError"
    this.status = status
    this.code = code
  }
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`
  return String(err)
}

function extractReply(data: unknown): string {
  if (typeof data === "string") {
    return data
  }

  if (Array.isArray(data)) {
    const parts = data.map((item) => extractReply(item)).filter((item) => item.length > 0)
    if (parts.length > 0) {
      return parts.join("")
    }
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>

    const outputText = record.output_text
    if (typeof outputText === "string" && outputText.trim().length > 0) {
      return outputText
    }

    const output = record.output
    if (Array.isArray(output)) {
      const chunks: string[] = []
      for (const item of output) {
        if (!item || typeof item !== "object") {
          continue
        }
        const itemRecord = item as Record<string, unknown>
        if (itemRecord.type !== "message") {
          continue
        }
        const content = itemRecord.content
        if (!Array.isArray(content)) {
          continue
        }

        for (const part of content) {
          if (!part || typeof part !== "object") {
            continue
          }
          const partRecord = part as Record<string, unknown>
          if (partRecord.type === "output_text" || partRecord.type === "text") {
            const text = partRecord.text
            if (typeof text === "string") {
              chunks.push(text)
            }
          }
        }
      }

      if (chunks.length > 0) {
        return chunks.join("")
      }
    }
  }

  return JSON.stringify(data, null, 2)
}

function extractResponseId(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined
  }

  const record = data as Record<string, unknown>
  const id = record.id
  if (typeof id === "string" && id.trim().length > 0) {
    return id
  }

  const nestedResponse = record.response
  if (nestedResponse && typeof nestedResponse === "object") {
    const nestedId = (nestedResponse as Record<string, unknown>).id
    if (typeof nestedId === "string" && nestedId.trim().length > 0) {
      return nestedId
    }
  }

  return undefined
}

function extractApiErrorCode(raw: string): string | undefined {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const cause = parsed.cause
    if (!cause || typeof cause !== "object") return undefined
    const causeRecord = cause as Record<string, unknown>
    const error = causeRecord.error
    if (!error || typeof error !== "object") return undefined
    const errorRecord = error as Record<string, unknown>
    const code = errorRecord.code
    return typeof code === "string" ? code : undefined
  } catch {
    return undefined
  }
}

export async function sendMedtronicGptMessage(
  config: MedtronicGptConfig,
  message: string,
  previousResponseId?: string,
  options: SendMessageOptions = {},
): Promise<MedtronicGptResult> {
  const { token, model } = config
  const endpoint = config.baseUrl ?? MEDTRONIC_GPT_RESPONSES_URL
  const fetchFn = options.fetchFn ?? fetch

  const body: Record<string, unknown> = {
    model,
    input: message,
  }

  if (options.instructions) {
    body.instructions = options.instructions
  }
  if (previousResponseId) {
    body.previous_response_id = previousResponseId
  }

  const requestId = `mtgpt-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  console.info("[MedtronicGPT] request:start", {
    requestId,
    endpoint,
    model,
    hasInstructions: Boolean(options.instructions),
    hasPreviousResponseId: Boolean(previousResponseId),
    inputLength: message.length,
  })

  let response: Response
  try {
    response = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error("[MedtronicGPT] request:network_error", {
      requestId,
      endpoint,
      model,
      error: toErrorMessage(err),
    })
    throw new Error(`Network error while calling MedtronicGPT: ${toErrorMessage(err)}`)
  }

  if (!response.ok) {
    const errText = await response.text()
    const apiErrorCode = extractApiErrorCode(errText)
    console.error("[MedtronicGPT] request:http_error", {
      requestId,
      endpoint,
      model,
      status: response.status,
      statusText: response.statusText,
      code: apiErrorCode,
      responsePreview: errText.slice(0, 1200),
    })
    throw new MedtronicGptApiError(`HTTP ${response.status}: ${errText}`, response.status, apiErrorCode)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch (err) {
    console.error("[MedtronicGPT] request:parse_error", {
      requestId,
      endpoint,
      model,
      error: toErrorMessage(err),
    })
    throw new Error(`Could not parse MedtronicGPT response JSON: ${toErrorMessage(err)}`)
  }

  const responseId = extractResponseId(data) ?? previousResponseId
  const reply = extractReply(data)
  console.info("[MedtronicGPT] request:success", {
    requestId,
    endpoint,
    model,
    responseId,
    replyLength: reply.length,
  })

  return {
    reply,
    responseId,
  }
}

export class MedtronicGptConversation {
  private previousResponseId: string | undefined

  constructor(private readonly config: MedtronicGptConfig) {}

  get id(): string | undefined {
    return this.previousResponseId
  }

  async send(message: string, options?: SendMessageOptions): Promise<MedtronicGptResult> {
    try {
      const result = await sendMedtronicGptMessage(this.config, message, this.previousResponseId, options)
      if (result.responseId) {
        this.previousResponseId = result.responseId
      }
      return result
    } catch (err) {
      const shouldRetryFresh =
        err instanceof MedtronicGptApiError &&
        err.code === "previous_response_not_found" &&
        Boolean(this.previousResponseId)

      if (!shouldRetryFresh) {
        throw err
      }

      console.warn("[MedtronicGPT] conversation:previous_response_not_found, retrying without previous_response_id")
      this.previousResponseId = undefined

      const retryResult = await sendMedtronicGptMessage(this.config, message, undefined, options)
      if (retryResult.responseId) {
        this.previousResponseId = retryResult.responseId
      }
      return retryResult
    }
  }

  reset(): void {
    this.previousResponseId = undefined
  }
}
