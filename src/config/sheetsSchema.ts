// Column indices for the "Formadores" Google Sheet tab.
// Must match the order in functions/src/sheetsSchema.ts and the appendToSheet call.
export const F = {
  TIMESTAMP:        0,
  NOME:             1,
  EMAIL:            2,
  TELEFONE:         3,
  DATA_NASCIMENTO:  4,
  NIF:              5,
  AREAS:            6,
  HABILITACOES:     7,
  CAP_CCP:          8,
  EXPERIENCIA:      9,
  LINKEDIN:        10,
  DIAS:            11,
  PERIODOS:        12,
  MODALIDADE:      13,
  MOTIVACAO:       14,
} as const;
