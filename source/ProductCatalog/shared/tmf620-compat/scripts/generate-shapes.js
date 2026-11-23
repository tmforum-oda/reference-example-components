'use strict';

// Generates generated/shapes.json from the two official TMF620 specifications the
// services run: the v4.0.0 Swagger of the v4 service and the v5.0.0 OAS of the v5
// service. The translator uses it to know, for every schema, which attributes exist,
// what they refer to, and (for v5) which schemas need @type and which subtypes exist.
//
//   npm run generate          writes generated/shapes.json
//   npm run generate -- --check   fails if the committed file is out of date
//
// Only schemas reachable from the five resources are kept.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..', '..', '..');
const V4_FILE = path.join(ROOT, 'productCatalogV4Microservice', 'implementation', 'api', 'swagger.yaml');
const V5_FILE = path.join(ROOT, 'productCatalogV5Microservice', 'implementation', 'api', 'TMF620-Product_Catalog_Management-v5.0.0.oas.yaml');
const OUT_FILE = path.join(__dirname, '..', 'generated', 'shapes.json');

const ROOTS = {
  v4: ['Catalog', 'Category', 'ProductOffering', 'ProductOfferingPrice', 'ProductSpecification'],
  v5: ['ProductCatalog', 'Category', 'ProductOffering', 'ProductOfferingPrice', 'ProductSpecification']
};

const refName = (r) => r.split('/').pop();

// Describes one property: {ref, array, oneOf, primitive}
function describe(prop) {
  if (!prop) return { primitive: 'any' };
  if (prop.$ref) return { ref: refName(prop.$ref) };
  if (prop.oneOf) return { oneOf: prop.oneOf.map(x => refName(x.$ref)) };
  if (prop.type === 'array') {
    const item = describe(prop.items);
    return Object.assign({ array: true }, item);
  }
  return { primitive: prop.type || 'any' };
}

function buildShapes(schemas, roots) {
  const shapes = {};
  const parentsOf = {};   // schema -> its allOf $ref parents

  function collect(name) {
    if (shapes[name] || !schemas[name]) return;
    const s = schemas[name];
    const shape = { props: {} };
    shapes[name] = shape;

    if (s.oneOf) {
      shape.oneOf = s.oneOf.map(x => refName(x.$ref));
      shape.oneOf.forEach(collect);
    }
    const parts = s.allOf ? s.allOf : [s];
    const parents = [];
    for (const part of parts) {
      if (part.$ref) {
        const parent = refName(part.$ref);
        parents.push(parent);
        collect(parent);
      } else {
        for (const [p, def] of Object.entries(part.properties || {})) shape.props[p] = describe(def);
      }
    }
    if (s.properties && s.allOf) {
      for (const [p, def] of Object.entries(s.properties)) shape.props[p] = describe(def);
    }
    if (parents.length) parentsOf[name] = parents;
    if (s.discriminator && s.discriminator.mapping) {
      shape.mapping = Object.keys(s.discriminator.mapping);
    }
    for (const d of Object.values(shape.props)) {
      if (d.ref) collect(d.ref);
      if (d.oneOf) d.oneOf.forEach(collect);
    }
  }
  roots.forEach(collect);

  // Flatten inherited properties and required lists
  function requiredOf(name) {
    const s = schemas[name];
    const req = new Set(s.required || []);
    for (const part of s.allOf || []) {
      if (part.$ref) requiredOf(refName(part.$ref)).forEach(r => req.add(r));
      else (part.required || []).forEach(r => req.add(r));
    }
    return req;
  }
  function inherited(name, seen = new Set()) {
    if (seen.has(name)) return {};
    seen.add(name);
    let props = {};
    for (const parent of parentsOf[name] || []) props = Object.assign(props, inherited(parent, seen));
    return Object.assign(props, shapes[name] ? shapes[name].props : {});
  }
  function ancestors(name, out = []) {
    for (const parent of parentsOf[name] || []) { out.push(parent); ancestors(parent, out); }
    return out;
  }
  const result = {};
  for (const name of Object.keys(shapes).sort()) {
    const shape = shapes[name];
    const entry = { props: inherited(name) };
    const anc = ancestors(name);
    if (anc.length) entry.extends = anc;
    if (shape.oneOf) entry.oneOf = shape.oneOf;
    if (shape.mapping) entry.mapping = shape.mapping;
    const req = [...requiredOf(name)].sort();
    if (req.length) entry.required = req;
    result[name] = entry;
  }
  // Subtypes: schemas (anywhere in the file) that extend a reachable discriminated base.
  // Needed because the v5.0.0 mapping leaves some out (compatibility matrix S5).
  for (const [name, s] of Object.entries(schemas)) {
    if (result[name] || !s.allOf || /_(FVO|MVO)$/.test(name) || /Event(Payload)?$/.test(name)) continue;
    const parents = s.allOf.filter(p => p.$ref).map(p => refName(p.$ref));
    if (parents.some(p => result[p] && result[p].mapping)) {
      collect(name);
      const entry = { props: inherited(name), extends: ancestors(name) };
      result[name] = entry;
    }
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}

function generate() {
  const v4 = yaml.load(fs.readFileSync(V4_FILE, 'utf8'));
  const v5 = yaml.load(fs.readFileSync(V5_FILE, 'utf8'));
  return {
    _comment: 'Generated by scripts/generate-shapes.js from the TMF620 v4.0.0 Swagger and v5.0.0 OAS. Do not edit.',
    v4: buildShapes(v4.definitions, ROOTS.v4),
    v5: buildShapes(v5.components.schemas, ROOTS.v5)
  };
}

if (require.main === module) {
  const text = JSON.stringify(generate(), null, 1) + '\n';
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
    if (current !== text) {
      console.error('generated/shapes.json is out of date: run npm run generate');
      process.exit(1);
    }
    console.log('generated/shapes.json is up to date');
  } else {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, text);
    console.log(`wrote ${OUT_FILE}`);
  }
}

module.exports = { generate };
