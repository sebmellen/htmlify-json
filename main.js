/**
 * Converts JSON data to semantic HTML with configurable headers and styling
 * @param {object|array|string|number|boolean|null} json - The JSON data to convert
 * @param {object} options - Configuration options
 * @param {Object<string, number>} [options.headers={}] - Mapping of JSON paths to heading levels (h1-h6)
 * @param {number} [options.indent=2] - Number of spaces for indentation
 * @param {string} [options.initialPath=""] - Initial path for the root object
 * @param {"default"|"none"|object} [options.useStyles="default"] - Styling configuration
 * @param {boolean|string[]} [options.listObjects=false] - Keys that should be rendered as lists
 * @param {boolean} [options.formatKeys=false] - Whether to format keys from camelCase/snake_case to normal text
 * @param {"inline"|"top"} [options.styleLocation="inline"] - Where to place styles: inline or in a top-level style tag
 * @param {"pretty"|"minified"|"none"} [options.outputFormat="none"] - Format of the final HTML output
 * @returns {string} The generated HTML string
 */
const jsonToHtml = (json, options = {}) => {
  const {
    headers = {},
    indent = 2,
    initialPath = "",
    useStyles = "default",
    listObjects = false,
    formatKeys = false,
    styleLocation = "inline",
    outputFormat = "minified",
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
    list: "margin: 0; padding-left: 20px; line-height: 1.5;",
    "top-list":
      "margin: 0; padding-left: 20px; list-style-type: '→'; list-style-position: outside; padding-left: 28px;",
    circular: "margin-left: 8px; color: #DC2626;",
  };

  const styles =
    useStyles === "none"
      ? {}
      : useStyles === "default"
      ? defaultStyles
      : { ...defaultStyles, ...useStyles };

  const applyStyle = (key) => {
    if (!styles[key]) return "";
    if (styleLocation === "inline") {
      if (key === "top-list") {
        return ` style="${styles[key].replace("'→'", "'\\2192'")}"`;
      }
      return ` style="${styles[key]}"`;
    }
    return ` class="json-${key}"`;
  };

  const generateStyleTag = () => {
    if (styleLocation !== "top" || useStyles === "none") return "";

    const styleRules = Object.entries(styles)
      .map(([key, value]) => {
        if (key === "top-list") {
          return `.json-${key} { ${value} }
.json-${key} > li { padding-left: 8px; }`;
        }
        return `.json-${key} { ${value} }`;
      })
      .join("\n");

    return `<style>\n${styleRules}\n</style>\n\n`;
  };

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

    // Check if this array contains nested objects that will become lists
    const hasNestedLists = arr.some(
      (item) => typeof item === "object" && item !== null
    );

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

    // Regular object rendering
    return keys
      .map((key) => {
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;
        const headerLevel = shouldBeHeader(newPath);

        console.log(`Checking path: ${newPath}, headerLevel: ${headerLevel}`); // Debug log

        if (headerLevel) {
          // For headers, show a preview of complex values within the header
          const valueHtml = convertValue(value, newPath, level + 1);
          return `<h${headerLevel}${applyStyle("heading")}>${escapeHtml(
            formatKey(key)
          )}: ${
            typeof value === "object" && value !== null
              ? `<span${applyStyle("value")}>${
                  Array.isArray(value) ? `[${value.length} items]` : "{...}"
                }</span>`
              : valueHtml
          }</h${headerLevel}>${
            typeof value === "object" && value !== null ? `\n${valueHtml}` : ""
          }`;
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

  const formatOutput = (html) => {
    switch (outputFormat) {
      case "minified":
        return html
          .replace(/>\s+</g, "><") // Remove whitespace between tags
          .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
          .replace(/[\n\r]/g, "") // Remove all newlines
          .trim();
      case "pretty":
        // Simple pretty print - you could use a more sophisticated library if needed
        let indentLevel = 0;
        const lines = html
          .replace(/></g, ">\n<") // Add newline between tags
          .split("\n")
          .map((line) => {
            line = line.trim();
            if (line.match(/<\/[^>]+>$/)) indentLevel--; // Closing tag
            const indentation = "  ".repeat(Math.max(0, indentLevel));
            if (line.match(/^<[^/][^>]*>$/)) indentLevel++; // Opening tag
            return indentation + line;
          });
        return lines.join("\n");
      default:
        return html; // No formatting
    }
  };

  return formatOutput(
    postProcessHtml(`${generateStyleTag()}<div${applyStyle("container")}>
${convertValue(json, initialPath)}
</div>`)
  );
};

export { jsonToHtml };
