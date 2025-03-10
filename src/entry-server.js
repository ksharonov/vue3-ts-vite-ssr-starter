import 'uno.css';
import { renderToString } from 'vue/server-renderer';
import { createApp } from './main';
import { ID_INJECTION_KEY } from 'element-plus';

function renderPreloadLinks(modules, manifest) {
  let links = '';
  const seen = new Set();
  modules.forEach((id) => {
    const files = manifest[id];
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file);
          links += renderPreloadLink(file);
        }
      });
    }
  });
  return links;
}

function renderPreloadLink(file) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`;
  } else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`;
  } else {
    return '';
  }
}

function renderTeleports(teleports) {
  if (!teleports) return '';
  return Object.entries(teleports).reduce((all, [key, value]) => {
    if (key.startsWith('#el-popper-container-')) {
      return `${all}<div id="${key.slice(1)}">${value}</div>`;
    }
    return all;
  }, teleports.body || '');
}
export async function render(url, manifest) {
  const { app, router, store } = createApp();
  app.provide(ID_INJECTION_KEY, {
    prefix: 1024,
    current: 0
  });
  try {
    await router.push(url);
    await router.isReady();
    const ctx = {};
    const html = await renderToString(app, ctx);
    const preloadLinks = renderPreloadLinks(ctx.modules, manifest);
    const teleports = renderTeleports(ctx.teleports);
    const state = JSON.stringify(store.state.value);
    return [html, state, preloadLinks, teleports];
  } catch (error) {
    console.log(error);
  }
}
