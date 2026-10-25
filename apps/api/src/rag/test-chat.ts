import { connectDatabase, disconnectDatabase, prisma } from "../config/database";
import { chatWithAssistant } from "./chat.service";

async function main() {
  await connectDatabase();
  const landlord = await prisma.landlord.findFirst();
  console.log("Testing chat for landlord:", landlord?.email);

  if (landlord) {
    const res = await chatWithAssistant({
      landlordId: landlord.id,
      role: "LANDLORD",
      message: "Who are my tenants and what are their rents?",
    });

    console.log("\n--- ASSISTANT ANSWER ---");
    console.log(res.answer);
    console.log("\n--- CITATIONS COUNT ---", res.citations.length);
    res.citations.forEach((c, i) => console.log(`[${i + 1}] ${c.sourceType} - ${c.snippet}`));
  }

  await disconnectDatabase();
}

main().catch((err) => {
  console.error("Test chat failed:", err);
  process.exit(1);
});
