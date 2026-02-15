import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/env";

// Initialize Resend with API key if available, otherwise mock it
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
    try {
        const { name, email, topic, message } = await req.json();

        // Basic validation
        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        if (!resend) {
            console.log("Mocking email send:", { name, email, topic, message });
            // Simulate delay
            await new Promise((resolve) => setTimeout(resolve, 500));
            return NextResponse.json({ success: true, mocked: true });
        }

        await resend.emails.send({
            from: "Y-US? Store <onboarding@resend.dev>", // Update this when you have a domain
            to: ["hi@y-us.shop"], // The user's support email
            replyTo: email,
            subject: `[${topic.toUpperCase()}] New message from ${name}`,
            text: `
Name: ${name}
Email: ${email}
Topic: ${topic}

Message:
${message}
      `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
