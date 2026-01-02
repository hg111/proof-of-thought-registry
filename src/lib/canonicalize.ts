import { config } from "@/lib/config";

export function canonicalize(input: string): string {
  let s = input ?? "";
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");

  if (!s.endsWith("\n")) s += "\n";

  if (s.length > config.maxTextChars) {
    throw new Error(`Submission too long. Max ${config.maxTextChars} characters.`);
  }
  return s;
}
