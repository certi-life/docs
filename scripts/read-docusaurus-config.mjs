import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';

function unwrapExpression(expression) {
  while (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isSatisfiesExpression(expression) ||
    ts.isTypeAssertionExpression(expression)
  ) {
    expression = expression.expression;
  }
  return expression;
}

function findUniqueProperty(object, name) {
  let match;
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property) || ts.isComputedPropertyName(property.name)) return undefined;
    if (
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
    ) {
      if (match || !ts.isPropertyAssignment(property)) return undefined;
      match = property;
    }
  }
  return match;
}

function stringProperty(object, name) {
  const property = findUniqueProperty(object, name);
  const value = property && unwrapExpression(property.initializer);
  return value && ts.isStringLiteral(value) ? value.text : undefined;
}

function booleanProperty(object, name) {
  const property = findUniqueProperty(object, name);
  const value = property && unwrapExpression(property.initializer);
  if (value?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value?.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

function findExportedConfigObject(sourceFile) {
  const exportDefault = sourceFile.statements.find(
    (statement) => ts.isExportAssignment(statement) && !statement.isExportEquals,
  );
  if (!exportDefault) return undefined;

  let expression = unwrapExpression(exportDefault.expression);
  if (ts.isIdentifier(expression)) {
    const declaration = sourceFile.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations)
      .find((candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === expression.text);
    if (!declaration?.initializer) return undefined;
    expression = unwrapExpression(declaration.initializer);
  }
  return ts.isObjectLiteralExpression(expression) ? expression : undefined;
}

function findClassicOptions(configObject) {
  const presetsProperty = findUniqueProperty(configObject, 'presets');
  const presets = presetsProperty && unwrapExpression(presetsProperty.initializer);
  if (!presets || !ts.isArrayLiteralExpression(presets) || presets.elements.some(ts.isSpreadElement)) {
    return undefined;
  }

  const classicPresets = presets.elements.filter((element) => {
    const preset = unwrapExpression(element);
    if (!ts.isArrayLiteralExpression(preset) || preset.elements.length === 0) return false;
    const name = unwrapExpression(preset.elements[0]);
    return ts.isStringLiteral(name) && name.text === 'classic';
  });
  if (classicPresets.length !== 1) return undefined;

  const preset = unwrapExpression(classicPresets[0]);
  if (preset.elements.length < 2) return undefined;
  const options = unwrapExpression(preset.elements[1]);
  return ts.isObjectLiteralExpression(options) ? options : undefined;
}

export function readDocusaurusPublicConfig(projectRoot) {
  const configPath = join(projectRoot, 'docusaurus.config.ts');
  const source = readFileSync(configPath, 'utf8');
  const sourceFile = ts.createSourceFile(configPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const configObject = findExportedConfigObject(sourceFile);
  if (!configObject) throw new Error('cannot statically resolve docusaurus.config.ts default export');

  const options = findClassicOptions(configObject);
  if (!options) throw new Error('cannot statically resolve the unique classic preset');
  const docsProperty = findUniqueProperty(options, 'docs');
  const docs = docsProperty && unwrapExpression(docsProperty.initializer);
  if (!docs || !ts.isObjectLiteralExpression(docs)) throw new Error('cannot statically resolve classic docs options');

  const sitemapProperty = findUniqueProperty(options, 'sitemap');
  const sitemap = sitemapProperty && unwrapExpression(sitemapProperty.initializer);
  return {
    source,
    url: stringProperty(configObject, 'url'),
    baseUrl: stringProperty(configObject, 'baseUrl'),
    trailingSlash: booleanProperty(configObject, 'trailingSlash'),
    docsRouteBasePath: stringProperty(docs, 'routeBasePath'),
    editUrl: stringProperty(docs, 'editUrl'),
    sitemapEnabled: Boolean(sitemap && ts.isObjectLiteralExpression(sitemap)),
  };
}
