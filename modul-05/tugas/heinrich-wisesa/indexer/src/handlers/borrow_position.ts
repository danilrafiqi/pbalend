import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("PBALend:Borrow", async ({event, context}) => {
    const { loanToken, collateralToken, user, amount, shares, collateralAmount } = event.args;

    const currentPosition = await context.db.find(schema.borrowPosition, {
        loanToken,
        collateralToken,
        user,
    });

    if (!currentPosition) {
        await context.db
        .insert(schema.borrowPosition)
        .values({
        loanToken,
        collateralToken,
        user,
        amount,
        shares,
        collateralAmount,
        })
        .onConflictDoNothing();
    }else{
        await context.db
        .update(schema.borrowPosition, {
          loanToken,
          collateralToken,
          user,
        })
        .set({
          amount: currentPosition.amount + amount,
          shares: currentPosition.shares + shares,
          collateralAmount: currentPosition.collateralAmount + collateralAmount,
        });
    }

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