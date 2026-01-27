import { NextRequest, NextResponse } from "next/server";
import { dbGetPublicChains, dbGetLatestAnchor } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const sort = searchParams.get("sort") as "genesis_desc" | "genesis_asc" | "lastseal_desc" | undefined;

    const { items, total } = dbGetPublicChains({ page, limit, sort });
    const anchor = dbGetLatestAnchor();

    return NextResponse.json({
        chains: items,
        total,
        page,
        limit,
        anchor
    });
}
