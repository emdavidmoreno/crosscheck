import type { NormalizerKey } from "@/types/crosscheck"
import {
  normAlnum,
  normName,
  normNumeric,
  normText,
  toDate,
} from "@/lib/normalize"

export const NORMALIZERS: Record<
  NormalizerKey,
  { label: string; fn: (v: unknown) => string }
> = {
  text: { label: "Texto", fn: normText },
  alphanumeric: { label: "Alfanumérico", fn: normAlnum },
  name: { label: "Nombre propio", fn: normName },
  date: {
    label: "Fecha",
    fn: (v) => {
      const d = toDate(v)
      return d ? d.toISOString().slice(0, 10) : ""
    },
  },
  numeric: { label: "Número", fn: (v) => String(normNumeric(v) ?? "") },
}
