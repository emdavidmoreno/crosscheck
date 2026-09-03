"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { capMatchResultForDemo } from "@/constants/demo"
import { runMatchCore } from "@/lib/match-engine"
import type { Combinator, MatchField, MatchResult } from "@/types/crosscheck"
import type {
  MatchWorkerRequest,
  MatchWorkerResponse,
} from "@/workers/match.worker"

type RunArgs = {
  left: Record<string, unknown>[]
  right: Record<string, unknown>[]
  fields: MatchField[]
  combinator: Combinator
  /** When set, only the first N result rows are stored (demo mode). */
  maxResultRows?: number
}

function finalizeResult(
  result: MatchResult,
  maxResultRows?: number
): MatchResult {
  if (maxResultRows == null) return result
  return capMatchResultForDemo(result, maxResultRows)
}

export function useMatchWorker() {
  const workerRef = useRef<Worker | null>(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<MatchResult | null>(null)
  const [error, setError] = useState("")

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setRunning(false)
    setProgress(0)
  }, [])

  useEffect(() => () => cancel(), [cancel])

  const run = useCallback(
    (payload: RunArgs) => {
      setResults(null)
      setProgress(0)
      setRunning(true)
      setError("")

      let worker: Worker | null = null
      try {
        worker = new Worker(
          new URL("../workers/match.worker.ts", import.meta.url),
          { type: "module" }
        )
      } catch {
        worker = null
      }

      if (!worker) {
        setTimeout(() => {
          try {
            setResults(
              finalizeResult(
                runMatchCore(
                  payload.left,
                  payload.right,
                  payload.fields,
                  payload.combinator,
                  {}
                ),
                payload.maxResultRows
              )
            )
          } catch (e) {
            setError(
              "El cruce falló: " +
                (e instanceof Error ? e.message : String(e))
            )
          }
          setRunning(false)
        }, 30)
        return
      }

      workerRef.current = worker
      worker.onmessage = (e: MessageEvent<MatchWorkerResponse>) => {
        if (e.data.type === "progress") setProgress(e.data.p)
        else if (e.data.type === "done") {
          setResults(finalizeResult(e.data.result, payload.maxResultRows))
          setRunning(false)
          setProgress(1)
          worker?.terminate()
          workerRef.current = null
        }
      }
      worker.onerror = () => {
        worker?.terminate()
        workerRef.current = null
        try {
          setResults(
            finalizeResult(
              runMatchCore(
                payload.left,
                payload.right,
                payload.fields,
                payload.combinator,
                {}
              ),
              payload.maxResultRows
            )
          )
        } catch (e2) {
          setError(
            "El cruce falló: " +
              (e2 instanceof Error ? e2.message : String(e2))
          )
        }
        setRunning(false)
      }
      const req: MatchWorkerRequest = {
        left: payload.left,
        right: payload.right,
        fields: payload.fields,
        combinator: payload.combinator,
        maxResultRows: payload.maxResultRows,
      }
      worker.postMessage(req)
    },
    []
  )

  const clearResults = useCallback(() => setResults(null), [])

  return {
    running,
    progress,
    results,
    error,
    setError,
    run,
    cancel,
    clearResults,
  }
}
