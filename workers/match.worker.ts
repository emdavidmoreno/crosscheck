import { capMatchResultForDemo } from "@/constants/demo"
import { runMatchCore } from "@/lib/match-engine"
import type { Combinator, MatchField, MatchResult } from "@/types/crosscheck"

export type MatchWorkerRequest = {
  left: Record<string, unknown>[]
  right: Record<string, unknown>[]
  fields: MatchField[]
  combinator: Combinator
  /** Cap stored rows before posting back to the main thread (demo mode). */
  maxResultRows?: number
}

export type MatchWorkerResponse =
  | { type: "progress"; p: number }
  | { type: "done"; result: MatchResult }

self.onmessage = (e: MessageEvent<MatchWorkerRequest>) => {
  const d = e.data
  let last = 0
  let result = runMatchCore(d.left, d.right, d.fields, d.combinator, {
    onProgress: (p) => {
      const now = Date.now()
      if (now - last > 120) {
        last = now
        const msg: MatchWorkerResponse = { type: "progress", p }
        self.postMessage(msg)
      }
    },
  })
  if (d.maxResultRows != null) {
    result = capMatchResultForDemo(result, d.maxResultRows)
  }
  const msg: MatchWorkerResponse = { type: "done", result }
  self.postMessage(msg)
}
