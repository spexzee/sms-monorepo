/**
 * Helper to match an origin against an allowed pattern
 * Supporting wildcards like https://*.spexzee.me or http://localhost:*
 * @param {string} origin - The request's origin header (e.g. 'https://yasnhs.spexzee.me')
 * @param {string} allowedPattern - An allowed origin pattern (e.g. 'https://*.spexzee.me')
 * @returns {boolean} - True if the origin matches the pattern
 */
function matchOrigin(origin, allowedPattern) {
    if (!origin || !allowedPattern) return false;
    
    // Check for exact match
    if (origin === allowedPattern) return true;
    
    // Check if the pattern contains a wildcard '*'
    if (allowedPattern.includes('*')) {
        // Escape standard regex characters except '*'
        const escaped = allowedPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        // Replace wildcard '*' with matching pattern for subdomains or ports (non-slash characters)
        const regexStr = '^' + escaped.replace(/\*/g, '[a-zA-Z0-9-.]+') + '$';
        const regex = new RegExp(regexStr);
        return regex.test(origin);
    }
    
    return false;
}

module.exports = { matchOrigin };
