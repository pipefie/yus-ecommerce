// scripts/update-slugs.ts
import slugify from "slugify";
import {prisma} from "../src/lib/prisma";

async function main() {
  const products = await prisma.product.findMany();
  for (const p of products) {
    // strict:true removes all punctuation except letters/numbers/dashes
    const newSlug = slugify(p.title, { lower: true, strict: true });
    if (p.slug !== newSlug) {
      await prisma.product.update({
        where: { id: p.id },
        data: { slug: newSlug },
      });
      console.log(`Updated slug ${p.id}:`, newSlug);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
