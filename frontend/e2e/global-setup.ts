import { execFileSync } from "node:child_process";

function runBackendScript(script: string) {
  const windows = process.platform === "win32";
  execFileSync(
    windows ? (process.env.ComSpec ?? "cmd.exe") : "npm",
    windows
      ? ["/d", "/s", "/c", `npm --prefix ../backend run ${script}`]
      : ["--prefix", "../backend", "run", script],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    },
  );
}

export default function globalSetup() {
  runBackendScript("prisma:e2e:migrate");
  runBackendScript("prisma:e2e:seed");
}
