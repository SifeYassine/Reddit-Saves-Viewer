import Papa from "papaparse";
import fs from "fs";

const csv = fs.readFileSync("public/db.csv", "utf-8");
const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });

const formatted = data
  .map((row) => {
    const match = row.url.match(/\/r\/([^\/]+)\/comments\/([^\/]+)\/([^\/]+)/);

    if (match) {
      const id = parseInt(match[2], 36);
      const subreddit = match[1];
      const title = match[3].replace(/_/g, " ");

      return { id, url: row.url, subreddit, title };
    }
  })
  .sort((a, b) => b.id - a.id);

fs.writeFileSync("public/db.sorted.csv", Papa.unparse(formatted));
console.log(`Formatted ${formatted.length} URLs -> public/db.sorted.csv`);
