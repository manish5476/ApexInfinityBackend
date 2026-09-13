const express = require('express');
const path = require('path');

// Let's test the regex parser for express layers
function parseLayerRegexp(layer) {
  if (!layer.regexp) return '';
  let str = layer.regexp.source;
  
  // Fast path for root
  if (str === '^\\/?(?=\\/|$)' || str === '^\\/(?:\\/)?$') return '';
  
  // Clean up express route regex
  // E.g.: ^\/api\/v1\/?(?=\/|$) -> /api/v1
  // E.g.: ^\/customers\/?(?=\/|$) -> /customers
  // E.g.: ^\/users\/(?:([^\/]+?))\/?(?=\/|$) -> /users/:id
  str = str
    .replace('^\\/?(?=\\/|$)', '')
    .replace('\\/?(?=\\/|$)', '')
    .replace('(?=\\/|$)', '')
    .replace('^', '')
    .replace('$', '');

  // Convert (?:([^\/]+?)) back to parameter names using keys if available
  if (layer.keys && layer.keys.length > 0) {
    layer.keys.forEach(key => {
      str = str.replace('(?:([^\\/]+?))', `:${key.name}`);
      str = str.replace('([^\\/]+?)', `:${key.name}`);
    });
  }

  // Unescape slashes and symbols
  str = str.replace(/\\\//g, '/').replace(/\\-/g, '-').replace(/\\_/g, '_').replace(/\\\./g, '.');
  str = str.replace(/\(\?\:([^\)]+)\)/g, '$1');
  return str;
}

console.log('Test regex parse:');
console.log(parseLayerRegexp({ regexp: /^\/api\/v1\/?(?=\/|$)/i }));
console.log(parseLayerRegexp({ regexp: /^\/sales\-returns\/?(?=\/|$)/i }));
console.log(parseLayerRegexp({ regexp: /^\/users\/(?:([^\/]+?))\/?(?=\/|$)/i, keys: [{ name: 'id' }] }));
