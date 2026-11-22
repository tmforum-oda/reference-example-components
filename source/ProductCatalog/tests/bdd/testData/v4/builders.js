'use strict';

// Renders telco-catalogue.yaml entries as TMF620 v4.0.0 create bodies: flat
// relatedParty, Category.parentId, productSpecCharacteristicValue with an untyped
// value, string valueFrom/valueTo, refs as {id, name}.
//
// ctx.ref(kind, key) returns {id, name} of an entry created earlier in the
// scenario, or undefined (the reference is then left out). ctx.name(name) tags a
// name with the run id.

const catalogue = require('../catalogue');

function refs(ctx, kind, list) {
  return (list || []).map(key => ctx.ref(kind, key)).filter(Boolean).map(r => ({ id: r.id, name: r.name }));
}

function owner(key) {
  const p = catalogue.party(key);
  return { id: p.id, name: p.name, role: p.role, '@referredType': p.referredType };
}

function term(months) {
  return [{ name: `${months}-month term`, duration: { amount: months, units: 'month' } }];
}

function charValue(v, valueType) {
  const out = { value: v.value };
  if (valueType) out.valueType = valueType;
  if (v.default) out.isDefault = true;
  if (v.unit) out.unitOfMeasure = v.unit;
  return out;
}

function characteristic(c) {
  const out = { name: c.name, valueType: c.valueType };
  if (c.configurable !== undefined) out.configurable = c.configurable;
  out.productSpecCharacteristicValue = c.range
    ? [{ valueFrom: String(c.range.from), valueTo: String(c.range.to), unitOfMeasure: c.range.unit }]
    : c.values.map(v => charValue(v));
  return out;
}

const build = {
  catalog(e, ctx) {
    const body = { name: ctx.name(e.name), description: e.description, catalogType: e.catalogType, version: e.version };
    if (e.owner) body.relatedParty = [owner(e.owner)];
    if (e.validFrom) body.validFor = { startDateTime: e.validFrom };
    const category = refs(ctx, 'category', e.categories);
    if (category.length) body.category = category;
    return body;
  },

  category(e, ctx) {
    const body = { name: ctx.name(e.name), description: e.description, isRoot: !!e.isRoot };
    const parent = e.parent && ctx.ref('category', e.parent);
    if (parent) body.parentId = parent.id;
    return body;
  },

  productSpecification(e, ctx) {
    const body = { name: ctx.name(e.name), description: e.description, brand: e.brand, productNumber: e.productNumber, version: e.version, isBundle: !!e.isBundle };
    if (e.owner) body.relatedParty = [owner(e.owner)];
    if (e.characteristics) body.productSpecCharacteristic = e.characteristics.map(characteristic);
    const bundled = refs(ctx, 'productSpecification', e.bundles);
    if (bundled.length) body.bundledProductSpecification = bundled;
    return body;
  },

  productOfferingPrice(e, ctx) {
    const body = { name: ctx.name(e.name), priceType: e.kind, isBundle: false };
    if (e.amount !== undefined) body.price = { unit: 'GBP', value: e.amount };
    if (e.kind === 'recurring') Object.assign(body, { recurringChargePeriodType: 'month', recurringChargePeriodLength: 1 });
    if (e.kind === 'usage') body.unitOfMeasure = { amount: 1, units: e.usageUnit };
    if (e.percentage !== undefined) body.percentage = e.percentage;
    if (e.termMonths) body.productOfferingTerm = term(e.termMonths);
    const rel = (e.relationships || []).map(r => ({ r, ref: ctx.ref('productOfferingPrice', r.price) })).filter(x => x.ref);
    if (rel.length) body.popRelationship = rel.map(({ r, ref }) => ({ id: ref.id, name: ref.name, relationshipType: r.type }));
    return body;
  },

  productOffering(e, ctx) {
    const body = { name: ctx.name(e.name), description: e.description, isBundle: !!e.isBundle, isSellable: true, version: '1.0' };
    const spec = e.specification && ctx.ref('productSpecification', e.specification);
    if (spec) body.productSpecification = { id: spec.id, name: spec.name };
    const prices = refs(ctx, 'productOfferingPrice', e.prices);
    if (prices.length) body.productOfferingPrice = prices;
    const category = refs(ctx, 'category', e.categories);
    if (category.length) body.category = category;
    const bundled = refs(ctx, 'productOffering', e.bundles);
    if (bundled.length) body.bundledProductOffering = bundled;
    if (e.termMonths) body.productOfferingTerm = term(e.termMonths);
    if (e.charValues) {
      body.prodSpecCharValueUse = e.charValues.map(c => {
        const use = { name: c.name, valueType: c.valueType, productSpecCharacteristicValue: [charValue({ value: c.value, unit: c.unit, default: true })] };
        if (spec) use.productSpecification = { id: spec.id };
        return use;
      });
    }
    return body;
  }
};

module.exports = { build: (kind, e, ctx) => build[kind](e, ctx) };
