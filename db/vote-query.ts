export type VoteQuery = readonly [sql: string, ...values: (string | number | null)[]];
export type VoteRow = Record<string, number>;
