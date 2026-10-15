// Open absolute http(s) links in rendered markdown in a new tab.
// Internal links stay in-page so View Transitions can handle them.
export default function rehypeExternalLinks() {
  const walk = (node) => {
    if (node.type === "element" && node.tagName === "a") {
      const href = node.properties?.href;
      if (typeof href === "string" && /^https?:\/\//i.test(href)) {
        node.properties.target = "_blank";
        node.properties.rel = ["noopener", "noreferrer"];
      }
    }
    node.children?.forEach(walk);
  };
  return walk;
}
