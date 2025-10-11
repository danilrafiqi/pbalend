import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("PBALend:Deposit", async ({event, context}) => {
    const { loanToken, collateralToken, user, amount, shares } = event.args;

    //TODO: Get the data from event and insert to DB

    console.log("PBALend:Deposit", {
        loanToken,
        collateralToken,
        user,
        amount,
        shares,
    });
});

ponder.on("PBALend:Withdraw", async ({event, context}) => {
    const { loanToken, collateralToken, user, amount, shares } = event.args;

    //TODO: Get the data from event and insert to DB

    console.log("PBALend:Withdraw", {
        loanToken,
        collateralToken,
        user,
        amount,
        shares,
    });
});