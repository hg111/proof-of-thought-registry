import { NextRequest, NextResponse } from "next/server";
import { computeAndStoreDailyRoot } from "@/lib/dailyRoot";
import { dbMarkDailyRootPublished } from "@/lib/db";

async function ghPutFile(args: {
  token: string;
  owner: string;
  repo: string;
  path: string;
  contentUtf8: string;
  message: string;
}) {
  const url = `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`;
  const b64 = Buffer.from(args.contentUtf8, "utf8").toString("base64");

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${args.token}`,
      "Content-Type": "application/json",
      "User-Agent": "proofofthought",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message: args.message,
      content: b64,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`GitHub publish failed: ${res.status} ${JSON.stringify(json)}`);
  return json;
}

export async function POST(req: NextRequest, { params }: { params: { day: string } }) {
  const day = params.day;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: "invalid day format (YYYY-MM-DD)" }, { status: 400 });
  }

  const secret = req.headers.get("x-root-publish-secret") || "";
  if (!process.env.ROOT_PUBLISH_SECRET || secret !== process.env.ROOT_PUBLISH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const out = computeAndStoreDailyRoot(day);

  const token = process.env.GITHUB_TOKEN!;
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;

  if (!token || !owner || !repo) {
    return NextResponse.json({ error: "missing github env" }, { status: 500 });
  }

  const jsonBody = JSON.stringify({
    dayUtc: out.dayUtc,
    root: out.root,
    leafCount: out.leafCount,
    leaves: out.leaves,
  }, null, 2);

  const filePath = `daily-roots/${day}.json`;
  const published = await ghPutFile({
    token,
    owner,
    repo,
    path: filePath,
    contentUtf8: jsonBody,
    message: `Publish daily root ${day}`,
  });

  // GitHub API returns a "content.html_url"
  const url = published?.content?.html_url || "";
  if (url) dbMarkDailyRootPublished(day, url);

  return NextResponse.json({ ok: true, day, root: out.root, url });
}