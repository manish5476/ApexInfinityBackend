const express = require('express');
const app = express();
const api = express.Router();
const auth = express.Router();
const users = express.Router();
auth.post('/login', (req, res) => {});
auth.post('/register', (req, res) => {});
users.get('/', (req, res) => {});
users.get('/:id', (req, res) => {});

api.use('/auth', auth);
api.use('/users', users);
app.use('/api/v1', api);

function cleanRegexp(layer) {
  if (!layer.regexp) return '';
  let str = layer.regexp.source;
  if (str === '^\\/?(?=\\/|$)' || str === '^\\/(?:\\/)?$') return '';
  str = str
    .replace('^\\/?(?=\\/|$)', '')
    .replace('\\/?(?=\\/|$)', '')
    .replace('(?=\\/|$)', '')
    .replace(/^\^/, '')
    .replace(/\$$/, '');
  if (layer.keys && layer.keys.length > 0) {
    layer.keys.forEach(k => {
      str = str.replace('(?:([^\\/]+?))', ':' + k.name);
      str = str.replace('([^\\/]+?)', ':' + k.name);
    });
  }
  return str.replace(/\\\//g, '/').replace(/\\-/g, '-').replace(/\\_/g, '_').replace(/\\\./g, '.');
}

function extractAll(app) {
  const routes = [];
  function walk(stack, prefix = '') {
    stack.forEach(layer => {
      if (layer.route) {
        const routePath = layer.route.path;
        const paths = Array.isArray(routePath) ? routePath : [routePath];
        paths.forEach(p => {
          let finalPath = (prefix + (p === '/' ? '' : p)) || '/';
          if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;
          Object.keys(layer.route.methods).forEach(m => {
            routes.push({ method: m.toUpperCase(), path: finalPath });
          });
        });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        const subPrefix = cleanRegexp(layer);
        walk(layer.handle.stack, prefix + subPrefix);
      }
    });
  }
  walk(app._router.stack);
  return routes;
}

console.log(extractAll(app));
