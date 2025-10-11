import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("PBALend:MarketCreated", async ({event, context}) => {
    const { loanToken, collateralToken, interestRate, LTV } = event.args;

    await context.db
    .insert(schema.market)
    .values({
      loanToken,
      collateralToken,
      interestRate,
      LTV,
    })
    .onConflictDoNothing();

    console.log("PBALend:MarketCreated", {
        loanToken,
        collateralToken,
        interestRate,
        LTV,
    });
});