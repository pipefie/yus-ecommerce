import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function AdminCMSPage() {
    const heroVideoConfig = await prisma.globalConfig.findUnique({
        where: { key: "hero_video_url" },
    });

    async function updateConfig(formData: FormData) {
        "use server";
        const videoUrl = formData.get("videoUrl") as string;
        if (videoUrl) {
            await prisma.globalConfig.upsert({
                where: { key: "hero_video_url" },
                update: { value: videoUrl },
                create: { key: "hero_video_url", value: videoUrl },
            });
        }
        revalidatePath("/");
        revalidatePath("/admin/cms");
    }

    return (
        <div className="max-w-2xl space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-100">Content Management</h1>
                <p className="text-slate-400">Manage global settings and homepage content.</p>
            </div>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-slate-200">Homepage Hero Video</h2>
                <p className="text-xs text-slate-400 mb-4">
                    Enter the absolute URL (starting with / or https://) for the background video.
                </p>
                <form action={updateConfig} className="space-y-4">
                    <label className="block">
                        <span className="text-sm text-slate-400">Video URL</span>
                        <input
                            name="videoUrl"
                            defaultValue={heroVideoConfig?.value || "/videos/hero-loop.mp4"}
                            className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                            placeholder="/videos/hero-loop.mp4"
                        />
                    </label>
                    <button
                        type="submit"
                        className="rounded bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        Save Changes
                    </button>
                </form>
            </section>
        </div>
    );
}
