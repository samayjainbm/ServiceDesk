require("dotenv").config();
const prisma = require("../config/db");

async function main() {
  // Ensure users exist (based on phone_number in complaints)
  const complaints = await prisma.ongoing_complaints.findMany({
    select: { complaint_id: true, phone_number: true, address: true },
  });

  for (const c of complaints) {
    // find or create user by phone_number
    const user = await prisma.user_info.upsert({
      where: { phone_number: c.phone_number },
      update: {},
      create: {
        user_name: `User_${c.phone_number.slice(-4)}`,
        user_address: c.address,
        phone_number: c.phone_number,
        password: "temp_password_change_later", // change later / hash later if you want
      },
      select: { user_id: true },
    });

    // update complaint with user_id
    await prisma.ongoing_complaints.update({
      where: { complaint_id: c.complaint_id },
      data: { user_id: user.user_id },
    });
  }

  console.log("✅ Filled user_id for existing complaints.");
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
