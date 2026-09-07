import type { LibrarySet } from "@/types/crosscheck"

export const SEED_LIBRARY: LibrarySet[] = [
  {
    id: "setSHARED01",
    name: "OPA ↔ AOS — cierre mensual",
    owner: "gretel@marielitos.com",
    savedAt: "2026-07-31",
    link: "crosscheck.app/s/HARED0",
    payload: {
      version: 2,
      combinator: "OR",
      fields: [
        {
          left: "Policy Number / Quote MVR",
          right: "Policy Number",
          normalizer: "alphanumeric",
          mode: "loose",
          threshold: 0.85,
          tolerance: 0,
          isKey: true,
        },
        {
          left: "Insured Named",
          right: "Client Name",
          normalizer: "name",
          mode: "fuzzy",
          threshold: 0.85,
          tolerance: 0,
          isKey: true,
        },
        {
          left: "Effective Date",
          right: "Effective Date",
          normalizer: "date",
          mode: "loose",
          threshold: 0.85,
          tolerance: 3,
          isKey: false,
        },
        {
          left: "Base Premium",
          right: "Premium",
          normalizer: "numeric",
          mode: "loose",
          threshold: 0.85,
          tolerance: 0.01,
          isKey: false,
        },
        {
          left: "Company",
          right: "Company",
          normalizer: "text",
          mode: "fuzzy",
          threshold: 0.7,
          tolerance: 0,
          isKey: false,
        },
      ],
      output: {
        columns: [
          { source: "left", column: "Insured Named" },
          { source: "right", column: "Policy Number" },
          { source: "left", column: "Base Premium" },
          { source: "right", column: "Premium" },
        ],
        groupBy: [],
      },
    },
  },
]

