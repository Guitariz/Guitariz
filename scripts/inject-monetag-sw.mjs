import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swPath = path.resolve(__dirname, "../dist/sw.js");
if (fs.existsSync(swPath)) {
  const monetagHeader = `self.options = {\n    "domain": "5gvci.com",\n    "zoneId": 11625720\n};\nself.lary = "";\nimportScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');\n\n`;
  const content = fs.readFileSync(swPath, "utf-8");
  if (!content.includes('"zoneId": 11625720')) {
    fs.writeFileSync(swPath, monetagHeader + content, "utf-8");
    console.log("[Monetag] Injected zone 11625720 header into dist/sw.js");
  }
}
