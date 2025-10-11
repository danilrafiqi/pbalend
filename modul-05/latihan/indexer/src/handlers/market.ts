import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("PBALend:MarketCreated", async ({event, context}) => {
    const { loanToken, collateralToken, interestRate, LTV } = event.args;

    //TODO: Get the data from event and insert to DB

    console.log("PBALend:MarketCreated", {
        loanToken,
        collateralToken,
        interestRate,
        LTV,
    });
});