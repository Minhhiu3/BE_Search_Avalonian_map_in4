import Map from "./map.schema";

async function getFormattedMap(name) {
  const doc = await Map.findOne({ name });

  if (!doc) return null;

  const counts = {};
  doc.icons.forEach(r => {
    counts[r] = (counts[r] || 0) + 1;
  });

  const icons = Object.entries(counts).map(([alt, count]) =>
    count > 1 ? { alt, badge: count } : { alt }
  );

  return {
    name: doc.name,
    tier: doc.tier,
    icons
  };
}

// getFormattedMap("Casos-Aiagsum").then(res => console.log(JSON.stringify(res, null, 2)));
