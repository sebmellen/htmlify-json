/**
 * Converts JSON data to semantic HTML with configurable headers and styling
 * @param {object|array|string|number|boolean|null} json - The JSON data to convert
 * @param {object} options - Configuration options
 * @param {Object<string, number>} [options.headers={}] - Mapping of JSON paths to heading levels (h1-h6)
 * @param {number} [options.indent=2] - Number of spaces for indentation
 * @param {string} [options.initialPath=""] - Initial path for the root object
 * @param {"default"|"none"|object} [options.useStyles="default"] - Styling configuration
 * @param {string[]} [options.listObjects=["additionalStatusDetails"]] - Keys that should be rendered as lists
 * @param {boolean} [options.formatKeys=false] - Whether to format keys from camelCase/snake_case to normal text
 * @returns {string} The generated HTML string
 */
const jsonToHtml = (json, options = {}) => {
  const {
    headers = {},
    indent = 2,
    initialPath = "",
    useStyles = "default",
    listObjects = ["additionalStatusDetails"],
    formatKeys = false,
  } = options;

  const defaultStyles = {
    container:
      "font-family: system-ui, sans-serif; line-height: 1.5; padding: 5px;",
    key: "font-weight: bold; color: #000;",
    value: "margin-left: 8px; color: #3b3b3b;",
    number: "margin-left: 8px; color: #0F766E;",
    boolean: "margin-left: 8px; color: #9333EA;",
    null: "margin-left: 8px; color: #888; font-style: italic;",
    heading: "margin: 16px 0 8px 0;",
    list: "margin: 0; padding-left: 20px;",
    circular: "margin-left: 8px; color: #DC2626;",
  };

  const styles =
    useStyles === "none"
      ? {}
      : useStyles === "default"
      ? defaultStyles
      : { ...defaultStyles, ...useStyles };

  const applyStyle = (key) => (styles[key] ? ` style="${styles[key]}"` : "");

  const visited = new WeakSet();

  const getIndent = (level) => " ".repeat(level * indent);

  const escapeHtml = (str) => {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const formatPrimitive = (value) => {
    if (value === null) {
      return `<span${applyStyle("null")}>null</span>`;
    }
    switch (typeof value) {
      case "number":
        return `<span${applyStyle("number")}>${value}</span>`;
      case "boolean":
        return `<span${applyStyle("boolean")}>${value}</span>`;
      case "string":
        return `<span${applyStyle("value")}>${escapeHtml(value)}</span>`;
      default:
        return `<span${applyStyle("value")}>${escapeHtml(
          String(value)
        )}</span>`;
    }
  };

  const shouldRenderAsList = (path) => {
    const lastKey = path.split(".").pop();
    return listObjects.includes(lastKey);
  };

  const shouldBeHeader = (path) => {
    // Helper to get header level, checking all path variants
    const checkPath = (p) => {
      if (headers[p]) return headers[p];

      // Check array pattern
      const arrayPattern = p.replace(/\[\d+\]/g, "[]");
      if (headers[arrayPattern]) return headers[arrayPattern];

      // Check normalized (no arrays)
      const normalized = p.replace(/\[\d+\]/g, "").replace(/\.\./g, ".");
      if (headers[normalized]) return headers[normalized];

      // NEW: Check just the last part after the last header
      const lastPart = p.split(".").pop();
      return headers[lastPart];
    };

    return checkPath(path);
  };

  const convertValue = (value, path = "", level = 0) => {
    if (value === null) {
      return formatPrimitive(null);
    }

    if (typeof value === "object" && value !== null) {
      if (visited.has(value)) {
        return `<span${applyStyle("circular")}>[Circular Reference]</span>`;
      }
      visited.add(value);
    }

    switch (typeof value) {
      case "object":
        if (Array.isArray(value)) {
          return convertArray(value, path, level);
        }
        return convertObject(value, path, level);
      default:
        return formatPrimitive(value);
    }
  };

  const convertArray = (arr, path, level) => {
    if (arr.length === 0) return "<div>(empty array)</div>";

    const indent = getIndent(level);

    // First, analyze the array to see if we need to split it due to headers
    const segments = arr.reduce((acc, item, index) => {
      if (typeof item === "object" && item !== null) {
        // Find any header properties in this item
        const headerEntries = Object.entries(item).filter(([key]) => {
          const fullPath = `${path}.${key}`; // Try direct path
          const normalizedPath = fullPath
            .replace(/\[\d+\]/g, "")
            .replace(/\.\./g, "."); // Try normalized
          return shouldBeHeader(fullPath) || shouldBeHeader(normalizedPath);
        });

        if (headerEntries.length > 0) {
          // Create a header segment
          acc.push({
            type: "header",
            content: headerEntries,
            remainingEntries: Object.entries(item).filter(
              ([key]) =>
                !shouldBeHeader(`${path}.${key}`) &&
                !shouldBeHeader(
                  `${path}.${key}`.replace(/\[\d+\]/g, "").replace(/\.\./g, ".")
                )
            ),
            itemPath: `${path}[${index}]`,
          });
          // Start a new list segment
          acc.push({
            type: "list",
            items: [],
          });
        } else {
          // Add to current list segment
          if (acc.length === 0 || acc[acc.length - 1].type === "header") {
            acc.push({ type: "list", items: [] });
          }
          acc[acc.length - 1].items.push({ item, index });
        }
      } else {
        // Handle primitive values
        if (acc.length === 0 || acc[acc.length - 1].type === "header") {
          acc.push({ type: "list", items: [] });
        }
        acc[acc.length - 1].items.push({ item, index });
      }
      return acc;
    }, []);

    // Render all segments
    return segments
      .map((segment) => {
        if (segment.type === "header") {
          // Render headers and their remaining properties
          return `${segment.content
            .map(([key, value]) => {
              const headerLevel = shouldBeHeader(`${path}.${key}`);
              return `${indent}<h${headerLevel}${applyStyle(
                "heading"
              )}>${escapeHtml(formatKey(key))}</h${headerLevel}>
${convertValue(value, `${segment.itemPath}.${key}`, level + 1)}`;
            })
            .join("\n")}
${segment.remainingEntries
  .map(
    ([key, value]) =>
      `${indent}<div><span${applyStyle("key")}>${escapeHtml(
        formatKey(key)
      )}:</span> ${convertValue(
        value,
        `${segment.itemPath}.${key}`,
        level + 1
      )}</div>`
  )
  .join("\n")}`;
        } else {
          // Render list segments
          if (segment.items.length === 0) return "";
          return `${indent}<ul${applyStyle("list")}>
${segment.items
  .map(
    ({ item, index }) =>
      `${getIndent(level + 1)}<li>${convertValue(
        item,
        `${path}[${index}]`,
        level + 1
      )}</li>`
  )
  .join("\n")}
${indent}</ul>`;
        }
      })
      .join("\n");
  };

  const toNormalText = (str) => {
    return (
      str
        // Handle snake_case first
        .split("_")
        .map(
          (word) =>
            // Capitalize first letter of each word
            word.charAt(0).toUpperCase() +
            // Handle camelCase within each word
            word.slice(1).replace(/([A-Z])/g, " $1")
        )
        .join(" ")
        // Clean up any extra spaces
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  const formatKey = (key) => (formatKeys ? toNormalText(key) : key);

  const convertObject = (obj, path, level) => {
    const keys = Object.keys(obj);
    if (keys.length === 0) return "<div>(empty object)</div>";

    const indent = getIndent(level);

    // If this object should be rendered as a list
    if (shouldRenderAsList(path)) {
      const items = keys
        .map((key) => {
          const value = obj[key];
          const newPath = path ? `${path}.${key}` : key;
          const headerLevel = headers[newPath];

          if (headerLevel) {
            // If it's a header, break it out of the list structure
            return `</ul>
<h${headerLevel}${applyStyle("heading")}>${escapeHtml(
              formatKey(key)
            )}</h${headerLevel}>
${convertValue(value, "", 1)}
<ul${applyStyle("list")}>`;
          }

          // Regular list item
          return `${indent}  <li><span${applyStyle("key")}>${escapeHtml(
            formatKey(key)
          )}:</span> ${convertValue(value, newPath, level + 1)}</li>`;
        })
        .join("\n");

      return `${indent}<ul${applyStyle("list")}>${items}${indent}</ul>`;
    }

    // Regular object rendering
    return keys
      .map((key) => {
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;
        const headerLevel = headers[newPath];

        if (headerLevel) {
          if (value === null || typeof value !== "object") {
            return `<h${headerLevel}${applyStyle("heading")}>
  <span${applyStyle("key")}>${escapeHtml(formatKey(key))}:</span>
  ${convertValue(value, "", 1)}
</h${headerLevel}>`;
          }

          return `<h${headerLevel}${applyStyle("heading")}>${escapeHtml(
            formatKey(key)
          )}</h${headerLevel}>
${convertValue(value, "", 1)}`;
        }

        // Non-header items
        if (value === null || typeof value !== "object") {
          return `${indent}<div>
  <span${applyStyle("key")}>${escapeHtml(formatKey(key))}:</span>
  ${convertValue(value, newPath, level + 1)}
</div>`;
        }

        return `${indent}<div>
  <div${applyStyle("key")}>${escapeHtml(formatKey(key))}</div>
  ${convertValue(value, newPath, level + 1)}
</div>`;
      })
      .join("\n\n");
  };

  return `<div${applyStyle("container")}>
${convertValue(json, initialPath)}
</div>`;
};

export { jsonToHtml };
