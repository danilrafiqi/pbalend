import {
  onchainTable,
  primaryKey,
} from "ponder";

export const market = onchainTable(
  "market",
  (t) => ({
    loanToken: t.hex().notNull(),
    collateralToken: t.hex().notNull(),
    interestRate: t.bigint().notNull(),
    LTV: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.loanToken, table.collateralToken],
    })
  })
);

export const lendPosition = onchainTable(
  "lend_position",
  (t) => ({
    loanToken: t.hex().notNull(),
    collateralToken: t.hex().notNull(),
    user: t.hex().notNull(),
    amount: t.bigint().notNull(),
    shares: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.loanToken, table.collateralToken, table.user],
    })
  }),
);

export const borrowPosition = onchainTable(
  "borrow_position",
  (t) => ({
    loanToken: t.hex().notNull(),
    collateralToken: t.hex().notNull(),
    user: t.hex().notNull(),
    amount: t.bigint().notNull(),
    shares: t.bigint().notNull(),
    collateralAmount: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.loanToken, table.collateralToken, table.user],
    })
  })
);