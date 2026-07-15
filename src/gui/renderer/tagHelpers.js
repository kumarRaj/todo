const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*/g;

function withoutUrls(content) {
  return content.replace(urlPattern, '');
}

function extractTaskTags(content) {
  return (withoutUrls(content).match(/#(\w[\w-]*)/g) || [])
    .map(tag => tag.substring(1).toLowerCase());
}

function hasTaskTag(content) {
  return /#\w+/.test(withoutUrls(content));
}

const tagHelpers = { extractTaskTags, hasTaskTag };

if (typeof module !== 'undefined') module.exports = tagHelpers;
if (typeof window !== 'undefined') window.tagHelpers = tagHelpers;
