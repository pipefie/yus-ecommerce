import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    // Handle both ID (numbers) and Slug (strings) if necessary, but schema uses Int ID.
    // The frontend passes 'product.id' which is a number (or stringified number).
    const id = parseInt(productId);
    if (isNaN(id)) {
        return NextResponse.json([], { status: 200 });
    }

    const reviews = await prisma.review.findMany({
        where: {
            productId: id,
            // For checking: authorize admin to see pending? For now public sees only approved?
            // Let's show all for now or approved.
            // status: "approved" 
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
}

export async function POST(req: Request) {
    try {
        const { productId, author, comment, rating } = await req.json();

        // Basic validation
        if (!productId || !author || !comment || !rating) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const id = typeof productId === 'string' ? parseInt(productId) : productId;

        const review = await prisma.review.create({
            data: {
                productId: id,
                author,
                comment,
                rating: Number(rating),
                status: "pending", // Default to pending
            },
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error("Review posting error:", error);
        return NextResponse.json({ error: "Failed to post review" }, { status: 500 });
    }
}
