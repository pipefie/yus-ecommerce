import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Seed Global Config with Hero Video
    await prisma.globalConfig.upsert({
        where: { key: 'hero_video_url' },
        update: {},
        create: {
            key: 'hero_video_url',
            value: '/videos/hero-loop.mp4',
        },
    })

    console.log('✅ Global Config seeded.')

    // Create a placeholder product if none exist (for testing)
    const productCount = await prisma.product.count()
    if (productCount === 0) {
        await prisma.product.create({
            data: {
                title: "Launch Day Hoodie",
                slug: "launch-day-hoodie",
                printfulProductId: "seed-123",
                description: "<p>The very first item.</p>",
                price: 4500,
                imageUrl: "",
                images: [],
                variants: {
                    create: [
                        {
                            printfulVariantId: "seed-v-1",
                            size: "L",
                            color: "Black",
                            price: 4500,
                            imageUrl: "",
                            previewUrl: "",
                            designUrls: []
                        }
                    ]
                }
            }
        })
        console.log('✅ Placeholder product seeded.')
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
