const fs = require("fs");
const f = "src/components/notificationBell/NotificationBell.jsx";
let s = fs.readFileSync(f, "utf8");

const from = `  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) load(); // refresh when opening
      return !prev;
    });
  };`;

const to = `  const handleToggle = () => {
    if (!open) load(); // refresh when opening (kept outside the updater)
    setOpen(!open);
  };`;

if (s.includes("if (!open) load();")) {
  console.log("already patched");
} else if (s.includes(from)) {
  s = s.replace(from, to);
  fs.writeFileSync(f, s);
  console.log("patched handleToggle");
} else {
  console.log("PATTERN NOT FOUND");
  process.exit(1);
}
