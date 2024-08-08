import RakutenSales from "~/models/RakutenSales";
import addDays from "~/utils/addDays";
import prisma from "~/db.server";

// export const loader = async ({ params }) => {
//   const memberId = params.id;
//   const currentDate = new Date("8/14/24");
//   console.log(currentDate);
//   let redeemableAmount = 0;
//   let pendingAmount = 0;

//   const salesData = await RakutenSales.findMany({
//     where: {
//       memberId: memberId,
//     },
//   });

//   salesData.forEach((sale) => {
//     const transactionDate = new Date(sale.transactionDate);
//     console.log(transactionDate);
//     const redeemableDate = addDays(transactionDate, 90);
//     const totalCommission = parseFloat(sale.totalCommission);

//     if (redeemableDate < currentDate) {
//       redeemableAmount += totalCommission;
//       // entry to db { id: xyz, redemable : 100 }
//     } else {
//       pendingAmount += totalCommission;
//     }
//   });
//   return {
//     redeemableAmount,
//     pendingAmount,
//   };
// };
export const loader = async ({ params }) => {
  const memberId = params.id;
  const currentDate = new Date("8/14/24");

  let redeemableAmount = 0;
  let pendingAmount = 0;

  // Fetch sales data for the member
  const salesData = await RakutenSales.findMany({
    where: {
      memberId: memberId,
    },
  });

  // Loop through sales data
  for (const sale of salesData) {
    const transactionDate = new Date(sale.transactionDate);
    const redeemableDate = addDays(transactionDate, 90);
    const totalCommission = parseFloat(sale.totalCommission);

    if (redeemableDate < currentDate) {
      // Check if this commission is already in the redeemable table
      const existingEntry = await prisma.redeemable.findFirst({
        where: {
          comissionId: sale.id,
        },
      });

      // If not already redeemable, insert into redeemable table
      if (!existingEntry) {
        await prisma.redeemable.create({
          data: {
            memberId: memberId,
            comissionId: sale.id,
            amount: totalCommission.toString(),
            redeemed: false, // Initially set to false
          },
        });
      }

      redeemableAmount += totalCommission;
    } else {
      pendingAmount += totalCommission;
    }
  }

  // Calculate redeemable amount from the redeemable table
  const redeemableEntries = await prisma.redeemable.findMany({
    where: {
      memberId: memberId,
      redeemed: false,
    },
  });

  redeemableAmount = redeemableEntries.reduce(
    (sum, entry) => sum + parseFloat(entry.amount),
    0
  );

  return { redeemableAmount, pendingAmount };
};

export const action = async ({ params }) => {
  let memberId = params.id;
  // return { memberId };

  let userInSale = await prisma.redeemable.findMany({
    where: {
      memberId: memberId,
    },
  });

  for (const user of userInSale) {
    await prisma.redeemable.update({
      where: {
        id: user.id,
      },
      data: {
        redeemed: true,
      },
    });
  }

  return { userInSale };
};
