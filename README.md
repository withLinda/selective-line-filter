# Selective Line Filter

A web tool that helps you filter text by keeping or removing specific lines.

<div align="center">

### 🚀 **[Try the Live Demo →](https://line-filter.vercel.app/)** 🚀

**No installation needed • Works in your browser • Privacy-first**

</div>

![Selective Line Filter Screenshot](./selective-line-filter-app-screenshot.png)

## What Does It Do?

This tool reads your text and finds lines that match your search words (called "needles"). You can choose to:
- **Keep** only the matching lines
- **Remove** the matching lines

All processing happens in your browser. No data is sent to any server.

## How to Use

### 1. Add Your Text
You can add text in three ways:
- **Paste** - Click the "Paste" button or press `Ctrl+V` / `Cmd+V`
- **Upload** - Click "Upload" and choose a file
- **Drag and Drop** - Drag a file into the input box

Supported file types: `.txt`, `.json`, `.jsonl`, `.md`

### 2. Add Your Needles
Needles are the words or patterns you want to find. You can:
- Type one needle per line, OR
- Separate needles with commas

**Example:**
```
ERROR
WARN
```

### 3. Choose Your Options

**Mode:**
- **Keep** - Show only lines that match your needles
- **Remove** - Hide lines that match your needles

**Pattern Options:**
- **Regex** - Use regular expressions for complex patterns
- **Case sensitive** - Match uppercase and lowercase exactly
- **Whole word** - Match complete words only (not parts of words)

### 4. Filter
Click the "Filter" button or press `Ctrl+Enter` / `Cmd+Enter`

### 5. Get Your Results
After filtering, you can:
- **Copy** - Copy results to clipboard (`Ctrl+Shift+C` / `Cmd+Shift+C`)
- **Download** - Save results as `filtered.txt`

## Use Cases

This tool is useful any time you have text with many lines and need to make a simple choice: **keep or remove** lines based on matching patterns.

Think of it like a gatekeeper that checks each line for a special word (the "needle"). If the word is found, the line is either kept or removed based on your choice.

### Practical Examples

**Log File Analysis**
- Keep only error lines from a large log file
- Remove debug messages to see important logs only

**Email and Contact Lists**
- Keep only email addresses ending with `.com`
- Remove all Gmail accounts from a list
- Find all emails from a specific domain

**Code Maintenance**
- Remove all commented lines from your code
- Extract only import statements to see dependencies
- Find all function definitions

**CSV Data Cleaning**
- Remove rows with `NULL` or empty values
- Delete lines with specific error codes
- Keep only valid data rows

**URL Lists**
- Keep only secure HTTPS URLs
- Remove URLs from specific websites
- Filter out broken or test links

**Configuration Files**
- Find settings that start with a specific prefix
- Remove old or deprecated configuration options
- Extract only database-related settings

**Git Diff Analysis**
- Show only lines that were added (start with `+`)
- Show only lines that were removed (start with `-`)
- Filter changes from specific files

**Data Validation**
- Remove lines that do not match expected patterns
- Keep only lines with valid phone numbers
- Filter out lines with special characters

**Text Preparation**
- Remove lines that contain numbers
- Delete lines with punctuation only
- Keep lines with specific keywords

**Web Scraping Results**
- Filter extracted data by keywords
- Remove duplicate or empty entries
- Keep only results from specific sections

### The Key Idea

If you have text where each line is separate and independent, and you need to decide whether to keep or discard each line based on a pattern, this tool can help. It works like a simple yes/no question for each line: "Does this line contain my search word?"

## Features

- **Line Numbers** - See line numbers for both input and output
- **Real-time Stats** - View total lines, kept lines, removed lines, and processing time
- **Keyboard Shortcuts** - Work faster with keyboard commands
- **Auto-save** - Your text and settings are saved in your browser
- **Privacy** - Everything runs in your browser, nothing is uploaded

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Run filter |
| `Ctrl/Cmd + Shift + C` | Copy results |
| `Esc` | Clear error messages |

## Technical Details

- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build for Production

```bash
npm run build
npm start
```

## License

MIT License - free to use, modify, and distribute.

## Contributing

This is a personal project. Feel free to fork it for your own use.

---

Made with care for developers who work with text and logs daily.
