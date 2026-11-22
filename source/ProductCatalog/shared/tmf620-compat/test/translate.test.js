'use strict';

// One block per row of compatibility-matrix.md.

const test = require('node:test');
const assert = require('node:assert');
const { v4ToV5, v5ToV4 } = require('..');
const { ctx, fixtures, withoutAddedTypes, codes, paths } = require('./helpers');

const BASE4 = fixtures.BASE4;
const toV5 = (r, d) => v4ToV5(r, d, ctx);
const toV4 = (r, d) => v5ToV4(r, d, ctx);

test('round trip: every telco fixture comes back unchanged through v5', () => {
  for (const resource of ['catalog', 'category', 'productSpecification', 'productOfferingPrice', 'productOffering']) {
    const v5 = toV5(resource, fixtures[resource]);
    assert.deepStrictEqual(v5.problems, [], `${resource}: ${JSON.stringify(v5.problems)}`);
    const back = toV4(resource, v5.doc);
    assert.deepStrictEqual(back.warnings, [], `${resource}: ${JSON.stringify(back.warnings)}`);
    const expected = JSON.parse(JSON.stringify(fixtures[resource]));
    expected.href = `${BASE4}/${resource}/${expected.id}`;
    assert.deepStrictEqual(withoutAddedTypes(back.doc, expected), expected, resource);
  }
});

test('G1: the catalog is stored as ProductCatalog and read back as Catalog', () => {
  const v5 = toV5('catalog', fixtures.catalog).doc;
  assert.strictEqual(v5['@type'], 'ProductCatalog');
  assert.strictEqual(v5['@baseType'], 'Catalog');
  const v4 = toV4('catalog', v5).doc;
  assert.strictEqual(v4['@type'], 'Catalog');
  assert.strictEqual(v4['@baseType'], undefined);
});

test('G2: every Extensible nested object gets @type; plain value types do not', () => {
  const v5 = toV5('productOffering', fixtures.productOffering).doc;
  assert.strictEqual(v5['@type'], 'ProductOffering');
  assert.strictEqual(v5.productSpecification['@type'], 'ProductSpecificationRef');
  assert.strictEqual(v5.category[0]['@type'], 'CategoryRef');
  assert.strictEqual(v5.channel[0]['@type'], 'ChannelRef');
  assert.strictEqual(v5.productOfferingTerm[0]['@type'], 'ProductOfferingTerm');
  assert.strictEqual(v5.prodSpecCharValueUse[0]['@type'], 'ProductSpecificationCharacteristicValueUse');
  assert.strictEqual(v5.productOfferingPrice[0]['@type'], 'ProductOfferingPriceRef');
  assert.strictEqual(v5.validFor['@type'], undefined, 'TimePeriod is not Extensible');
  assert.strictEqual(v5.productOfferingTerm[0].duration['@type'], undefined, 'Duration is not Extensible');
});

test('G3: a custom subtype with @schemaLocation passes through both ways', () => {
  const pop = Object.assign({}, fixtures.productOfferingPrice, {
    pricingLogicAlgorithm: [{ '@type': 'RecurringRatingPLA', '@schemaLocation': 'https://example.test/schema/RecurringRatingPLA.json', name: 'Monthly rating', ratingPeriod: 'month' }]
  });
  const v5 = toV5('productOfferingPrice', pop);
  assert.deepStrictEqual(v5.problems, []);
  assert.strictEqual(v5.doc.pricingLogicAlgorithm[0]['@type'], 'RecurringRatingPLA');
  assert.strictEqual(v5.doc.pricingLogicAlgorithm[0].ratingPeriod, 'month', 'extension attribute kept');
  const v4 = toV4('productOfferingPrice', v5.doc);
  assert.deepStrictEqual(v4.warnings, []);
  assert.strictEqual(v4.doc.pricingLogicAlgorithm[0].ratingPeriod, 'month');
});

test('G4: own hrefs are stored version-neutral; other hrefs are left alone', () => {
  const po = Object.assign({}, fixtures.productOffering, {
    place: [{ id: 'gb', href: 'https://geo.example.test/place/gb' }],
    marketSegment: [{ id: 'ms', href: 'https://localhost/r2-productcatalogmanagement/tmf-api/productCatalogManagement/v4/category/x' }]
  });
  const v5 = toV5('productOffering', po).doc;
  assert.strictEqual(v5.href, '/productOffering/po-5g-unlimited-24');
  assert.strictEqual(v5.productSpecification.href, '/productSpecification/ps-5g-mobile');
  assert.strictEqual(v5.place[0].href, 'https://geo.example.test/place/gb');
  assert.strictEqual(v5.marketSegment[0].href, 'https://localhost/r2-productcatalogmanagement/tmf-api/productCatalogManagement/v4/category/x', 'another component instance');
  // a v5-style href to this component is normalised too
  const fromV5Href = toV5('catalog', { id: 'c', name: 'c', category: [{ id: 'k', href: '/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v5/category/k' }] }).doc;
  assert.strictEqual(fromV5Href.category[0].href, '/category/k');
  assert.strictEqual(toV4('productOffering', v5).doc.productSpecification.href, `${BASE4}/productSpecification/ps-5g-mobile`);
});

test('R1: relatedParty is restructured both ways; PartyRole becomes PartyRoleRef', () => {
  const v5 = toV5('catalog', Object.assign({}, fixtures.catalog, {
    relatedParty: [fixtures.catalog.relatedParty[0], { id: 'pr-9', name: 'Catalogue manager', role: 'manager', '@referredType': 'PartyRole' }]
  })).doc;
  assert.deepStrictEqual(v5.relatedParty[0], { '@type': 'RelatedPartyRefOrPartyRoleRef', role: 'owner', partyOrPartyRole: { '@type': 'PartyRef', id: 'org-001', name: 'Example Telco', '@referredType': 'Organization' } });
  assert.strictEqual(v5.relatedParty[1].partyOrPartyRole['@type'], 'PartyRoleRef');
  const v4 = toV4('catalog', v5).doc;
  assert.deepStrictEqual(v4.relatedParty[1], { id: 'pr-9', name: 'Catalogue manager', role: 'manager', '@referredType': 'PartyRole' });
});

test('R1: a v5 PartyRef without @referredType gets one derived from its @type', () => {
  const v4 = toV4('catalog', { '@type': 'ProductCatalog', id: 'c', name: 'c', relatedParty: [{ '@type': 'RelatedPartyRefOrPartyRoleRef', role: 'owner', partyOrPartyRole: { '@type': 'PartyRef', id: 'p' } }] }).doc;
  assert.strictEqual(v4.relatedParty[0]['@referredType'], 'Party');
});

test('R2: PartyRoleRef partyId/partyName are left out of the v4 view with a warning', () => {
  const v5 = { '@type': 'ProductCatalog', id: 'c', name: 'c', relatedParty: [{ '@type': 'RelatedPartyRefOrPartyRoleRef', role: 'manager', partyOrPartyRole: { '@type': 'PartyRoleRef', id: 'pr-9', partyId: 'ind-1', partyName: 'Sam Jones' } }] };
  const r = toV4('catalog', v5);
  assert.strictEqual(r.doc.relatedParty[0].partyId, undefined);
  assert.deepStrictEqual(paths(r.warnings, 'W-PARTYROLE'), ['relatedParty[0].partyOrPartyRole.partyId', 'relatedParty[0].partyOrPartyRole.partyName']);
});

test('K1: Category parentId <-> parent; parent.version gets a warning', () => {
  const v5 = toV5('category', fixtures.category).doc;
  assert.deepStrictEqual(v5.parent, { '@type': 'CategoryRef', id: 'catg-mobile', href: '/category/catg-mobile' });
  assert.strictEqual(v5.parentId, undefined);
  v5.parent.version = '2';
  const r = toV4('category', v5);
  assert.strictEqual(r.doc.parentId, 'catg-mobile');
  assert.strictEqual(r.doc.parent, undefined);
  assert.deepStrictEqual(paths(r.warnings), ['parentId.version']);
  assert.deepStrictEqual(paths(r.warnings), paths(r.warnings, 'W-V5ONLY-ATTR'));
});

test('S1: characteristic attributes are renamed and get an internal id', () => {
  const v5 = toV5('productSpecification', fixtures.productSpecification).doc;
  const ch = v5.productSpecCharacteristic[0];
  assert.ok(ch.characteristicValueSpecification);
  assert.strictEqual(ch.productSpecCharacteristicValue, undefined);
  assert.match(ch.id, /^gen-/);
  ch['@valueSchemaLocation'] = 'https://example.test/schema/allowance.json';
  const r = toV4('productSpecification', v5);
  assert.strictEqual(r.doc.productSpecCharacteristic[0].id, undefined, 'internal id hidden');
  assert.deepStrictEqual(paths(r.warnings), ['productSpecCharacteristic[0].@valueSchemaLocation'], 'internal id is not reported, @valueSchemaLocation is');
});

test('S2: value @type is inferred from valueType, or from the value', () => {
  const ps = {
    id: 'ps', name: 'Types',
    productSpecCharacteristic: [{
      name: 'mixed',
      productSpecCharacteristicValue: [
        { valueType: 'text', value: 'a' },
        { valueType: 'decimal', value: 1.5 },
        { value: 7 },
        { value: 2.5 },
        { value: false },
        { value: { colour: 'Midnight' } },
        { value: ['red', 'blue'] },
        { valueType: 'integer', value: [1, 2] },
        { valueType: 'map', value: { a: 1 } },
        { valueFrom: '1', valueTo: '5' }
      ]
    }]
  };
  const r = toV5('productSpecification', ps);
  assert.deepStrictEqual(r.problems, []);
  assert.deepStrictEqual(r.doc.productSpecCharacteristic[0].characteristicValueSpecification.map(v => v['@type']), [
    'StringCharacteristicValueSpecification', 'NumberCharacteristicValueSpecification', 'IntegerCharacteristicValueSpecification',
    'NumberCharacteristicValueSpecification', 'BooleanCharacteristicValueSpecification', 'ObjectCharacteristicValueSpecification',
    'StringArrayCharacteristicValueSpecification', 'IntegerArrayCharacteristicValueSpecification', 'MapCharacteristicValueSpecification',
    'CharacteristicValueSpecification'
  ]);
});

test('S2: the characteristic valueType applies to its values', () => {
  const r = toV5('productSpecification', { id: 'ps', name: 'x', productSpecCharacteristic: [{ name: 'Speed', valueType: 'integer', productSpecCharacteristicValue: [{ value: 500 }] }] });
  assert.strictEqual(r.doc.productSpecCharacteristic[0].characteristicValueSpecification[0]['@type'], 'IntegerCharacteristicValueSpecification');
});

test('S2: a value that does not fit its valueType is refused with 422', () => {
  const r = toV5('productSpecification', { id: 'ps', name: 'x', productSpecCharacteristic: [{ name: 'Data allowance', valueType: 'integer', productSpecCharacteristicValue: [{ value: 'Unlimited' }, { value: ['a', 1] }] }] });
  assert.deepStrictEqual(codes(r.problems), ['TMF620-COMPAT-422-CHARVALUE-TYPE', 'TMF620-COMPAT-422-CHARVALUE-TYPE']);
  assert.deepStrictEqual(paths(r.problems), ['productSpecCharacteristic[0].productSpecCharacteristicValue[0]', 'productSpecCharacteristic[0].productSpecCharacteristicValue[1]']);
  assert.match(r.problems[0].detail, /"Unlimited" is not a integer/);
});

test('S2: a v4 @type that is not a v5 value subtype is replaced, with a warning', () => {
  const r = toV5('productSpecification', { id: 'ps', name: 'x', productSpecCharacteristic: [{ name: 'Colour', productSpecCharacteristicValue: [{ '@type': 'StringCharacteristic', value: 'Midnight' }] }] });
  assert.strictEqual(r.doc.productSpecCharacteristic[0].characteristicValueSpecification[0]['@type'], 'StringCharacteristicValueSpecification');
  assert.deepStrictEqual(codes(r.warnings), ['W-CHARVALUE-TYPE']);
});

test('S3: valueFrom/valueTo must be integers', () => {
  const r = toV5('productSpecification', { id: 'ps', name: 'x', productSpecCharacteristic: [{ name: 'Speed', valueType: 'number', productSpecCharacteristicValue: [{ valueFrom: '0.5', valueTo: '10GB' }] }] });
  assert.deepStrictEqual(codes(r.problems), ['TMF620-COMPAT-422-RANGE-NOT-INTEGER', 'TMF620-COMPAT-422-RANGE-NOT-INTEGER']);
  assert.match(r.problems[1].hint, /unitOfMeasure/);
});

test('S4: charSpecRelationship fields are renamed; charSpecSeq is refused', () => {
  const ok = toV5('productSpecification', { id: 'ps', name: 'x', productSpecCharacteristic: [{ name: 'a', productSpecCharRelationship: [{ id: 'ps2', href: `${BASE4}/productSpecification/ps2`, name: 'b', relationshipType: 'dependency' }] }] });
  assert.deepStrictEqual(ok.doc.productSpecCharacteristic[0].charSpecRelationship[0], { '@type': 'CharacteristicSpecificationRelationship', parentSpecificationId: 'ps2', parentSpecificationHref: '/productSpecification/ps2', name: 'b', relationshipType: 'dependency' });
  const bad = toV5('productSpecification', { id: 'ps', name: 'x', productSpecCharacteristic: [{ name: 'a', productSpecCharRelationship: [{ id: 'ps2', name: 'b', charSpecSeq: 2 }] }] });
  assert.deepStrictEqual(paths(bad.problems, 'TMF620-COMPAT-422-V4ONLY-ATTR'), ['productSpecCharacteristic[0].productSpecCharRelationship[0].charSpecSeq']);
  assert.match(bad.problems[0].hint, /order the relationship array/);
});

test('S4: characteristicSpecificationId (v5 only) gets a warning on read', () => {
  const v5 = toV5('productSpecification', { id: 'ps', name: 'x', productSpecCharacteristic: [{ name: 'a', productSpecCharRelationship: [{ id: 'ps2', name: 'b' }] }] }).doc;
  v5.productSpecCharacteristic[0].charSpecRelationship[0].characteristicSpecificationId = 'ch-7';
  const r = toV4('productSpecification', v5);
  assert.deepStrictEqual(paths(r.warnings), ['productSpecCharacteristic[0].productSpecCharRelationship[0].characteristicSpecificationId']);
  assert.strictEqual(r.doc.productSpecCharacteristic[0].productSpecCharRelationship[0].id, 'ps2');
});

test('S5: Boolean values are stored as BooleanCharacteristicValueSpecification', () => {
  const v5 = toV5('productSpecification', fixtures.productSpecification).doc;
  assert.strictEqual(v5.productSpecCharacteristic[2].characteristicValueSpecification[0]['@type'], 'BooleanCharacteristicValueSpecification');
});

test('S6, S7: targetServiceSchema and targetProductSchema.@baseType are refused; targetProductSchema @type is fine', () => {
  const r = toV5('productSpecification', {
    id: 'ps', name: 'Business Firewall',
    targetProductSchema: { '@type': 'Firewall', '@schemaLocation': 'https://example.test/schema/Firewall.json', '@baseType': 'Product' },
    serviceSpecification: [{ id: 'ss-1', targetServiceSchema: { '@type': 'FirewallService', '@schemaLocation': 'https://example.test/s.json' } }]
  });
  assert.deepStrictEqual(paths(r.problems).sort(), ['serviceSpecification[0].targetServiceSchema', 'targetProductSchema.@baseType']);
  const ok = toV5('productSpecification', { id: 'ps', name: 'Business Firewall', targetProductSchema: { '@type': 'Firewall', '@schemaLocation': 'https://example.test/schema/Firewall.json' } });
  assert.deepStrictEqual(ok.problems, []);
});

test('S8: attachments become Attachment or AttachmentRef; neither is refused', () => {
  const r = toV5('productOffering', { id: 'po', name: 'x', attachment: [{ id: 'att-1', name: 'Terms' }, { url: 'https://example.test/t.pdf', mimeType: 'application/pdf' }, { name: 'nothing to go on' }] });
  assert.strictEqual(r.doc.attachment[0]['@type'], 'AttachmentRef');
  assert.strictEqual(r.doc.attachment[1]['@type'], 'Attachment');
  assert.deepStrictEqual(paths(r.problems, 'TMF620-COMPAT-422-ATTACHMENT-AMBIGUOUS'), ['attachment[2]']);
});

test('S9, O5, P2: v5-only top-level attributes are left out of v4 reads with a warning', () => {
  const extra = {
    externalIdentifier: [{ '@type': 'ExternalIdentifier', id: 'SKU-1', owner: 'ERP' }],
    policy: [{ '@type': 'PolicyRef', id: 'pol-1' }]
  };
  const cases = [
    ['productSpecification', Object.assign({ category: [{ '@type': 'CategoryRef', id: 'k' }], intentSpecification: { '@type': 'IntentSpecificationRef', id: 'i' } }, extra), ['category', 'externalIdentifier', 'intentSpecification', 'policy']],
    ['productOffering', Object.assign({ allowedAction: [{ '@type': 'AllowedProductAction', action: 'add' }], productOfferingRelationship: [{ '@type': 'ProductOfferingRelationship', id: 'po2', relationshipType: 'requires' }], productOfferingCharacteristic: [], bundledGroupProductOffering: [] }, extra), ['allowedAction', 'bundledGroupProductOffering', 'externalIdentifier', 'policy', 'productOfferingCharacteristic', 'productOfferingRelationship']],
    ['productOfferingPrice', extra, ['externalIdentifier', 'policy']]
  ];
  for (const [resource, add, expected] of cases) {
    const v5 = Object.assign({ '@type': resource.charAt(0).toUpperCase() + resource.slice(1), id: 'x', name: 'x' }, add);
    const r = toV4(resource, v5);
    assert.deepStrictEqual(paths(r.warnings, 'W-V5ONLY-ATTR').sort(), expected, resource);
    expected.forEach(k => assert.strictEqual(r.doc[k], undefined, `${resource}.${k}`));
  }
});

test('G9, P3: ref version and relationship role are left out with a warning', () => {
  const v5 = toV5('productOfferingPrice', fixtures.productOfferingPrice).doc;
  v5.popRelationship[0].role = 'discount';
  v5.popRelationship[0].version = '3';
  const r = toV4('productOfferingPrice', v5);
  assert.deepStrictEqual(paths(r.warnings).sort(), ['popRelationship[0].role', 'popRelationship[0].version']);
});

test('O1: embedded prices become refs (with id) or are left out (without id)', () => {
  const v5 = toV5('productOffering', fixtures.productOffering).doc;
  v5.productOfferingPrice.push(
    { '@type': 'ProductOfferingPrice', id: 'pop-emb', name: 'Embedded with id', priceType: 'oneTime' },
    { '@type': 'ProductOfferingPrice', name: 'Embedded without id', priceType: 'oneTime' }
  );
  const r = toV4('productOffering', v5);
  assert.deepStrictEqual(r.doc.productOfferingPrice.map(p => p.id), ['pop-5g-unlimited-monthly', 'pop-emb']);
  assert.deepStrictEqual(paths(r.warnings, 'W-EMBEDDED-POP'), ['productOfferingPrice[1]', 'productOfferingPrice[2]']);
  assert.deepStrictEqual(r.omitted, ['productOfferingPrice']);
});

test('O3: bundledProductOffering lifecycleStatus is refused', () => {
  const r = toV5('productOffering', { id: 'po', name: 'Home Bundle', isBundle: true, bundledProductOffering: [{ id: 'po-ff1000', lifecycleStatus: 'Active' }, { id: 'po-tv' }] });
  assert.deepStrictEqual(paths(r.problems), ['bundledProductOffering[0].lifecycleStatus']);
  assert.match(r.problems[0].hint, /bundled offering itself/);
});

test('O4: prodSpecCharValueUse values are typed and get an internal id', () => {
  const v5 = toV5('productOffering', fixtures.productOffering).doc;
  const use = v5.prodSpecCharValueUse[0];
  assert.match(use.id, /^gen-/);
  assert.strictEqual(use.productSpecCharacteristicValue[0]['@type'], 'StringCharacteristicValueSpecification');
  assert.strictEqual(toV4('productOffering', v5).doc.prodSpecCharValueUse[0].id, undefined);
});

test('P1: constraint is refused with the policy hint', () => {
  const r = toV5('productOfferingPrice', Object.assign({}, fixtures.productOfferingPrice, { constraint: [{ id: 'c-1', name: 'Max 5 per account' }] }));
  assert.deepStrictEqual(paths(r.problems), ['constraint']);
  assert.match(r.problems[0].hint, /policy \(PolicyRef\)/);
});

test('attributes neither version defines pass through both ways without a report', () => {
  const v5 = toV5('category', Object.assign({}, fixtures.category, { marketingTag: 'black-friday' }));
  assert.deepStrictEqual(v5.problems, []);
  const v4 = toV4('category', v5.doc);
  assert.deepStrictEqual(v4.warnings, []);
  assert.strictEqual(v4.doc.marketingTag, 'black-friday');
});

test('internal storage fields are never returned', () => {
  const v5 = Object.assign(toV5('category', fixtures.category).doc, { _id: 'mongo', _schema: 'TMF620-5.0.0' });
  const v4 = toV4('category', v5).doc;
  assert.strictEqual(v4._id, undefined);
  assert.strictEqual(v4._schema, undefined);
});

test('MCP server example payloads: constraint is refused, the rest translates', () => {
  const path = require('path');
  const dir = path.join(__dirname, '..', '..', '..', 'MCPServerMicroservice', 'example_payloads');
  const pop = toV5('productOfferingPrice', require(path.join(dir, 'productOfferingPrice.json')));
  assert.deepStrictEqual(pop.problems.map(p => p.path), ['constraint']);
  for (const [file, resource] of [['catalog', 'catalog'], ['category', 'category'], ['productOffering', 'productOffering'], ['productSpecification', 'productSpecification']]) {
    const r = toV5(resource, require(path.join(dir, `${file}.json`)));
    assert.ok(r.problems.every(p => p.code === 'TMF620-COMPAT-422-V4ONLY-ATTR'), `${file}: ${JSON.stringify(r.problems)}`);
    console.log(`    MCP example ${file}: ${r.problems.length ? r.problems.map(p => p.path).join(', ') : 'translates cleanly'}`);
  }
});

test('relatedParty on a resource that defines none (an extension attribute) passes through unchanged', () => {
  const ext = [{ id: 'pr-9', role: 'manager', '@referredType': 'PartyRole' }];
  const v5 = toV5('productOffering', { id: 'po', name: 'x', relatedParty: ext });
  assert.deepStrictEqual(v5.doc.relatedParty, ext);
  const v4 = toV4('productOffering', { '@type': 'ProductOffering', id: 'po', name: 'x', relatedParty: [{ '@type': 'RelatedPartyRefOrPartyRoleRef', partyOrPartyRole: { '@type': 'PartyRef', id: 'p' } }] });
  assert.deepStrictEqual(v4.doc.relatedParty, [{ '@type': 'RelatedPartyRefOrPartyRoleRef', partyOrPartyRole: { '@type': 'PartyRef', id: 'p' } }]);
  assert.deepStrictEqual(v4.warnings, []);
});
