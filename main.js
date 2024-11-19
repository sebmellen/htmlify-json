/**
 * Converts JSON data to semantic HTML with configurable headers and styling
 * @param {object|array|string|number|boolean|null} json - The JSON data to convert
 * @param {object} options - Configuration options
 * @param {Object<string, number>} [options.headers={}] - Mapping of JSON paths to heading levels (h1-h6)
 * @param {string} [options.initialPath=""] - Initial path for the root object
 * @param {"default"|"none"|object} [options.useStyles="default"] - Styling configuration
 * @param {boolean|string[]} [options.listObjects=false] - Keys that should be rendered as lists
 * @param {boolean} [options.formatKeys=false] - Whether to format keys from camelCase/snake_case to normal text
 * @param {"inline"|"top"} [options.styleLocation="inline"] - Where to place styles: inline or in a top-level style tag
 * @returns {string} The generated HTML string
 */

const jsonToHtml = (json, options = {}) => {
  const {
    headers = {},
    initialPath = "",
    useStyles = "default",
    listObjects = false,
    formatKeys = false,
    styleLocation = "inline",
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
    list: "margin: 0; padding: 0; line-height: 1.5; list-style: none;", // Fully reset list styles
    "top-list": "margin: 0; padding: 0; list-style: none;", // Avoid newline for top list markers
    "top-list-item": "display: inline-flex; align-items: center;", // Prevent newline and align
    "top-list-marker": "margin-right: 8px; color: #000;", // Style marker manually
    circular: "margin-left: 8px; color: #FF0000;",
  };

  const styles =
    useStyles === "none"
      ? {}
      : useStyles === "default"
      ? defaultStyles
      : { ...defaultStyles, ...useStyles };

  // Function to apply inline or class-based styles dynamically
  const applyStyle = (key) => {
    if (!styles[key]) return "";

    if (styleLocation === "inline") {
      // Handle special cases for characters needing Unicode escape sequences
      if (key === "top-list") {
        return ` style="${styles[key].replace("'↘'", "'\\2198'")}"`; // Unicode for ↘
      }
      return ` style="${styles[key]}"`; // General inline styles
    }

    return ` class="json-${key}"`; // Class-based styles
  };

  const generateStyleTag = () => {
    if (styleLocation !== "top" || useStyles === "none") return "";

    const styleRules = Object.entries(styles)
      .map(([key, value]) => {
        if (key === "top-list") {
          return `.json-${key} { ${value} }
.json-${key} > li { color: inherit; }
.json-${key} > li::marker { color: #9CA3AF; }`;
        }
        return `.json-${key} { ${value} }`;
      })
      .join("\n");

    return `<style>\n${styleRules}\n</style>\n\n`;
  };

  const visited = new WeakSet();

  const getIndent = (level) => " ".repeat(level * 2);

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
    if (Array.isArray(listObjects)) {
      const lastKey = path.split(".").pop();
      return listObjects.includes(lastKey);
    }
    return listObjects;
  };

  const shouldBeHeader = (path) => {
    // For paths containing array indices (e.g., "path[0].property")
    if (path.match(/\[\d+\]/)) {
      // Convert numeric indices to [] (e.g., "path[].property")
      const arrayPattern = path.replace(/\[\d+\]/g, "[]");
      return headers[arrayPattern] || null;
    }

    // For regular paths, only exact matches
    return headers[path] || null;
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

    // Check if this array contains nested objects that should become lists
    const hasNestedLists = arr.some((item) => {
      if (typeof item !== "object" || item === null) return false;
      // If listObjects is true, any object should become a list
      if (listObjects === true) return true;
      // For array of listObjects keys, check if any nested keys match
      if (Array.isArray(listObjects)) {
        return Object.keys(item).some((key) => listObjects.includes(key));
      }
      return false;
    });

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
              const valueHtml = convertValue(
                value,
                `${segment.itemPath}.${key}`,
                level + 1
              );
              return `${indent}<h${headerLevel}${applyStyle(
                "heading"
              )}>${escapeHtml(formatKey(key))}: ${
                typeof value === "object" && value !== null
                  ? `<span${applyStyle("value")}>${
                      Array.isArray(value) ? `[${value.length} items]` : "{...}"
                    }</span>`
                  : valueHtml
              }</h${headerLevel}>${
                typeof value === "object" && value !== null
                  ? `\n${valueHtml}`
                  : ""
              }`;
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
          // Use top-list style for outer lists under headers that contain nested lists
          const listStyle = listObjects && hasNestedLists ? "top-list" : "list";
          return `${indent}<ul${applyStyle(listStyle)}>
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

    // Add this block to handle list rendering
    if (shouldRenderAsList(path)) {
      const items = keys
        .map((key) => {
          const value = obj[key];
          const newPath = path ? `${path}.${key}` : key;
          const headerLevel = shouldBeHeader(newPath);

          if (headerLevel) {
            // If it's a header, break it out of the list structure
            return `</ul>
<h${headerLevel}${applyStyle("heading")}>${escapeHtml(
              formatKey(key)
            )}</h${headerLevel}>
${convertValue(value, newPath, 1)}
<ul${applyStyle("list")}>`;
          }

          // Regular list item
          return `${indent}  <li><span${applyStyle("key")}>${escapeHtml(
            formatKey(key)
          )}:</span> ${convertValue(value, newPath, level + 1)}</li>`;
        })
        .join("\n");

      // Use top-list style for top-level lists when listObjects is true
      const listStyle = level === 0 ? "top-list" : "list";
      return `${indent}<ul${applyStyle(listStyle)}>${items}${indent}</ul>`;
    }

    // Add the regular object rendering logic here
    return keys
      .map((key) => {
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;
        const headerLevel = shouldBeHeader(newPath);

        if (headerLevel) {
          // Show full value for primitives only, no preview for objects/arrays
          const headerContent =
            typeof value === "object" && value !== null
              ? "" // No preview text for objects/arrays
              : convertValue(value, newPath, level + 1);

          return `${indent}<h${headerLevel}${applyStyle(
            "heading"
          )}>${escapeHtml(formatKey(key))}${
            headerContent ? `: ${headerContent}` : ""
          }</h${headerLevel}>${
            typeof value === "object" && value !== null
              ? `\n${convertValue(value, newPath, level + 1)}`
              : ""
          }`;
        }

        return `${indent}<div><span${applyStyle("key")}>${escapeHtml(
          formatKey(key)
        )}:</span> ${convertValue(value, newPath, level + 1)}</div>`;
      })
      .join("\n");
  };

  // Add post-processing function
  const postProcessHtml = (html) => {
    // Only apply top-list styling when we have a key followed by a list containing another list
    let processed = html.replace(
      /(<li><span[^>]*json-key[^>]*>[^<]*<\/span>\s*<ul[^>]*json-list[^>]*>(?=\s*<li>\s*<ul))/g,
      (match) => {
        return match.replace("json-list", "json-top-list");
      }
    );

    // Remove empty ul tags
    let previousHtml;
    do {
      previousHtml = processed;
      processed = processed.replace(/<ul[^>]*>\s*<\/ul>/g, "");
    } while (processed !== previousHtml);

    return processed;
  };

  return postProcessHtml(`${generateStyleTag()}<div${applyStyle("container")}>
${convertValue(json, initialPath)}
</div>`)
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .replace(/[\n\r]/g, "")
    .trim();
};

export { jsonToHtml };
