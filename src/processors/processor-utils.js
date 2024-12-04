import fs from 'fs/promises';

/**
 * Reads the template file content
 * @param {string} templatePath Path to the template
 * @returns {Promise<string>} Template content
 */
export const readTemplate = async (templatePath) => {
  try {
    return await fs.readFile(templatePath, 'utf8');
  } catch (err) {
    throw new Error(`Error reading file at ${templatePath}: ${err.message}`);
  }
};

/**
 * Replaces hooks with actual content, leaving hooks in if no replacement is provided
 * @param {string} content Template content
 * @param {Object} hookReplacements Hook replacements
 * @param {Object} [options] Optional settings
 * @param {boolean} [options.validate=false] Whether to perform validation on hooks
 * @returns {string} Updated content
 */
export const replaceHooks = (content, hookReplacements, options = { validate: false }) => {
  for (const [hookPoint, replacement] of Object.entries(hookReplacements)) {
    if (options.validate && !replacement) {
      throw new Error(`Missing required hook content for ${hookPoint}`);
    }
    // Only add the replacement after the hookPoint
    if (replacement !== undefined) {
      const hookPosition = content.indexOf(hookPoint);
      if (hookPosition !== -1) {
        const hookLineEnd = hookPosition + hookPoint.length;
        content = content.slice(0, hookLineEnd) + '\n' + replacement + content.slice(hookLineEnd);
      }
    }
  }
  return content;
};
