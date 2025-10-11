import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("PBALend:Borrow", async ({event, context}) => {
    const { loanToken, collateralToken, user, amount, shares, collateralAmount } = event.args;

    //TODO: Get the data from event and insert to DB

    console.log("PBALend:Borrow", {
        loanToken,
        collateralToken,
        user,
        amount,
        shares,
        collateralAmount,
    });
});

ponder.on("PBALend:Repay", async ({event, context}) => {
    const { loanToken, collateralToken, user, shares, amount } = event.args;

    //TODO: Get the data from event and insert to DB

    console.log("PBALend:Repay", {
        loanToken,
        collateralToken,
        user,
        shares,
        amount,
    });
});

ponder.on("PBALend:WithdrawCollateral", async ({event, context}) => {
    const { loanToken, collateralToken, user, amount } = event.args;

    //TODO: Get the data from event and insert to DB

    console.log("PBALend:WithdrawCollateral", {
        loanToken,
        collateralToken,
        user,
        amount,
    });
});