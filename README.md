# 🎨 htmlify-json

The simplest, most elegant way to transform JSON into beautiful HTML.

## ✨ Features

- **Zero Dependencies**: Pure JavaScript goodness
- **Semantic HTML**: Clean, accessible output
- **Customizable Styling**: Built-in themes or bring your own
- **Smart Formatting**: Handles nested objects, arrays, and even circular references
- **Type-Aware**: Beautiful color coding for different data types
- **Header Support**: Automatically create HTML headings based on JSON paths
- **List Rendering**: Convert specific objects into HTML lists
- **Key Formatting**: Optional automatic conversion of camelCase/snake_case to readable text

## 🚀 Installation

```bash
npm install htmlify-json
```

## 📖 Usage

```javascript
import { jsonToHtml } from "htmlify-json";

const json = {
  name: "John Doe",
  age: 30,
  isActive: true,
  address: {
    street: "123 Main St",
    city: "Anytown",
  },
};

const html = jsonToHtml(json);
// That's it! 🎉
```

## ⚙️ Configuration

Customize the output with these optional settings:

```javascript
const options = {
  // Define which JSON paths should be rendered as headers (h1-h6)
  headers: {
    "user.name": 1,
    "user.details": 2,
  },
  // Customize indentation (default: 2 spaces)
  indent: 4,
  // Style configuration: "default", "none", or custom styles
  useStyles: "default",
  // Convert specific objects to lists
  listObjects: ["items", "details"],
  // Format keys to be more readable
  formatKeys: true,
};

const html = jsonToHtml(json, options);
```

## 🎨 Styling

Built-in styling includes:

- Color-coded data types
- Clean, modern typography
- Proper spacing and indentation
- Responsive layout

Want your own style? Override the defaults:

```javascript
const customStyles = {
  container: "your-custom-styles",
  key: "your-key-styles",
  value: "your-value-styles",
};

const html = jsonToHtml(json, { useStyles: customStyles });
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Open issues
- Submit PRs
- Suggest features
- Improve documentation

## 📜 License

MIT © Sebastian Mellen

---

<p align="center">Made with ❤️ for the JavaScript community</p>
