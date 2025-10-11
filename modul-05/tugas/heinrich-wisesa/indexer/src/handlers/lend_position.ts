import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("PBALend:Deposit", async ({event, context}) => {
    const { loanToken, collateralToken, user, amount, shares } = event.args;

    const currentPosition = await context.db.find(schema.lendPosition, {
        loanToken,
        collateralToken,
        user,
    });

    if (!currentPosition) {
        await context.db
        .insert(schema.lendPosition)
        .values({
          loanToken,
          collateralToken,
          user,
          amount,
          shares,
        }).onConflictDoNothing();
    }else{
        await context.db
        .update(schema.lendPosition, {
          loanToken,
          collateralToken,
          user,
        })
        .set({
          amount: currentPosition.amount + amount,
          shares: currentPosition.shares + shares,
        });
    }

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