'use strict';

// Renders telco-catalogue.yaml entries as TMF620 v5.0.0 create bodies (FVOs):
// @type on every nested object, RelatedPartyRefOrPartyRoleRef, Category.parent,
// characteristicValueSpecification with typed subtypes, integer ranges.
// The resource's own @type, lifecycleStatus, lastUpdate and priceType defaults
// are added by Tmf620V5Client.build.
//
// ctx.ref(kind, key) returns {id, name} of an entry created earlier in the
// scenario, or undefined (the reference is then left out). ctx.name(name) tags a
// name with the run id.

const catalogue = require('../catalogue');

const VALUE_TYPES = { string: 'String', integer: 'Integer', number: 'Number', boolean: 'Boolean' };

function valueSpecType(valueType) {
  const t = VALUE_TYPES[valueType];
  if (!t) throw new Error(`No v5 characteristic value subtype for valueType '${valueType}'`);
  return `${t}CharacteristicValueSpecification`;
}

function refs(ctx, kind, list, type) {
  return (list || []).map(key => ctx.ref(kind, key)).filter(Boolean).map(r => ({ '@type': type, id: r.id, name: r.name }));
}

function owner(key) {
  const p = catalogue.party(key);
  return {
    '@type': 'RelatedPartyRefOrPartyRoleRef',
    role: p.role,
    partyOrPartyRole: { '@type': 'PartyRef', id: p.id, name: p.name, '@referredType': p.referredType }
  };
}

function term(months) {
  return [{ '@type': 'ProductOfferingTerm', name: `${months}-month term`, duration: { amount: months, units: 'month' } }];
}

function charValue(v, valueType) {
  const out = { '@type': valueSpecType(valueType), value: v.value };
  if (v.default) out.isDefault = true;
  if (v.unit) out.unitOfMeasure = v.unit;
  return out;
}

function characteristic(c) {
  const out = { '@type': 'CharacteristicSpecification', name: c.name, valueType: c.valueType };
  if (c.configurable !== undefined) out.configurable = c.configurable;
  out.characteristicValueSpecification = c.range
    ? [{ '@type': 'IntegerCharacteristicValueSpecification', valueFrom: c.range.from, valueTo: c.range.to, unitOfMeasure: c.range.unit }]
    : c.values.map(v => charValue(v, c.valueType));
  return out;
}

const build = {
  catalog(e, ctx) {
    const body = { name: ctx.name(e.name), description: e.description, catalogType: e.catalogType, version: e.version };
    if (e.owner) body.relatedParty = [owner(e.owner)];
    if (e.validFrom) body.validFor = { startDateTime: e.validFrom };
    const category = refs(ctx, 'category', e.categories, 'CategoryRef');
    if (category.length) body.category = category;
    return body;
  },

  category(e, ctx) {
    const body = { name: ctx.name(e.name), description: e.description, isRoot: !!e.isRoot };
    const parent = e.parent && ctx.ref('category', e.parent);
    if (parent) body.parent = { '@type': 'CategoryRef', id: parent.id };
    return body;
  },

  productSpecification(e, ctx) {
    const body = { name: ctx.name(e.name), description: e.description, brand: e.brand, productNumber: e.productNumber, version: e.version, isBundle: !!e.isBundle };
    if (e.owner) body.relatedParty = [owner(e.owner)];
    if (e.characteristics) body.productSpecCharacteristic = e.characteristics.map(characteristic);
    const bundled = refs(ctx, 'productSpecification', e.bundles, 'BundledProductSpecification');
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
    if (rel.length) body.popRelationship = rel.map(({ r, ref }) => ({ '@type': 'ProductOfferingPriceRelationship', id: ref.id, name: ref.name, relationshipType: r.type }));
    return body;
  },

  productOffering(e, ctx) {
    const body = { name: ctx.name(e.name), description: e.description, isBundle: !!e.isBundle, isSellable: true, version: '1.0' };
    const spec = e.specification && ctx.ref('productSpecification', e.specification);
    if (spec) body.productSpecification = { '@type': 'ProductSpecificationRef', id: spec.id, name: spec.name };
    const prices = refs(ctx, 'productOfferingPrice', e.prices, 'ProductOfferingPriceRef');
    if (prices.length) body.productOfferingPrice = prices;
    const category = refs(ctx, 'category', e.categories, 'CategoryRef');
    if (category.length) body.category = category;
    const bundled = refs(ctx, 'productOffering', e.bundles, 'BundledProductOffering');
    if (bundled.length) body.bundledProductOffering = bundled;
    if (e.termMonths) body.productOfferingTerm = term(e.termMonths);
    if (e.charValues) {
      body.prodSpecCharValueUse = e.charValues.map(c => {
        const use = {
          '@type': 'ProductSpecificationCharacteristicValueUse',
          name: c.name,
          valueType: c.valueType,
          productSpecCharacteristicValue: [charValue({ value: c.value, unit: c.unit, default: true }, c.valueType)]
        };
        if (spec) use.productSpecification = { '@type': 'ProductSpecificationRef', id: spec.id };
        return use;
      });
    }
    return body;
  }
};

module.exports = { build: (kind, e, ctx) => build[kind](e, ctx) };
