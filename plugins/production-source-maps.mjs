import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {isAbsolute, join, relative} from 'node:path';

const namespace = 'webpack://@certi-life/docs/';
const rspackSyntheticSource = /^webpack:\/\/@certi-life\/docs\/(?:\.\.\/)*\^\.\/\/\(\)\$$/;

function walkFiles(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

export default function productionSourceMaps(context) {
  function portableModuleName(info) {
    const rawPath = info.absoluteResourcePath || info.resourcePath;
    const loaderSeparator = rawPath.lastIndexOf('|');
    const modulePath = loaderSeparator >= 0 ? rawPath.slice(loaderSeparator + 1) : rawPath;
    const portablePath = (isAbsolute(modulePath) ? relative(context.siteDir, modulePath) : modulePath)
      .replaceAll('\\', '/')
      .replace(/^\.\//, '');
    return `${namespace}${portablePath}`;
  }

  return {
    name: 'production-source-maps',
    configureWebpack() {
      return {
        // Public no-sources maps keep production stack traces debuggable,
        // let Lighthouse verify mappings, and avoid publishing source contents.
        devtool: 'nosources-source-map',
        output: {
          devtoolModuleFilenameTemplate: portableModuleName,
          devtoolFallbackModuleFilenameTemplate: `${namespace}generated/[hash]`,
        },
      };
    },
    postBuild({outDir}) {
      // Rspack's fallback name includes checkout depth and ignores the configured
      // fallback template. Normalize that single synthetic identifier in output.
      for (const path of walkFiles(outDir).filter((file) => file.endsWith('.map'))) {
        const sourceMap = JSON.parse(readFileSync(path, 'utf8'));
        let changed = false;
        sourceMap.sources = sourceMap.sources.map((source) => {
          if (!rspackSyntheticSource.test(source)) return source;
          changed = true;
          return `${namespace}generated/rspack-runtime`;
        });
        if (changed) writeFileSync(path, JSON.stringify(sourceMap));
      }
    },
  };
}
