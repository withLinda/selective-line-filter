import { escapeRegex } from "./filter";

export function replaceText(
  input: string,
  find: string,
  replacement: string,
  caseSensitive: boolean,
): { output: string; replacements: number } {
  if (!find) return { output: input, replacements: 0 };

  let replacements = 0;
  // Textareas normalize newlines to LF. Match logical line breaks in imported
  // files too, without normalizing the source or changing unmatched bytes.
  const body = find.split(/\r\n|\r|\n/).map(escapeRegex).join("(?:\\r\\n|\\r|\\n)");
  const pattern = new RegExp(body, caseSensitive ? "gu" : "giu");
  const output = input.replace(pattern, () => {
    replacements++;
    // A callback keeps dollar tokens and backslashes literal.
    return replacement;
  });
  return { output, replacements };
}
