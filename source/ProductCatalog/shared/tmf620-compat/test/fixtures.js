'use strict';

// Realistic v4 payloads from a brand-neutral telco catalogue ("Example Telco"),
// used for round-trip tests. Ids are fixed so expectations are stable.

const BASE4 = 'https://localhost/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4';

const owner = { id: 'org-001', name: 'Example Telco', role: 'owner', '@referredType': 'Organization' };

module.exports = {
  BASE4,
  catalog: {
    id: 'cat-consumer',
    name: 'Example Telco Consumer Catalogue',
    description: 'Mobile, broadband and TV for consumers',
    catalogType: 'Product',
    version: '2026.11',
    lifecycleStatus: 'Active',
    validFor: { startDateTime: '2026-11-01T00:00:00Z' },
    relatedParty: [owner],
    category: [{ id: 'catg-mobile', href: `${BASE4}/category/catg-mobile`, name: 'Mobile' }]
  },
  category: {
    id: 'catg-sim-only',
    name: 'SIM-only Plans',
    description: 'Mobile plans without a device',
    isRoot: false,
    parentId: 'catg-mobile',
    lifecycleStatus: 'Active',
    productOffering: [{ id: 'po-5g-unlimited-24', name: '5G Unlimited SIM-only 24 months' }]
  },
  productSpecification: {
    id: 'ps-5g-mobile',
    name: '5G Mobile Service',
    brand: 'Example Telco',
    productNumber: 'MOB-5G',
    lifecycleStatus: 'Active',
    isBundle: false,
    relatedParty: [owner],
    productSpecCharacteristic: [
      { name: 'Data allowance', valueType: 'string', configurable: true, productSpecCharacteristicValue: [{ value: '30GB' }, { value: '100GB' }, { value: 'Unlimited', isDefault: true }] },
      { name: 'Network technology', valueType: 'string', productSpecCharacteristicValue: [{ value: '5G SA' }, { value: '5G NSA' }, { value: '4G' }] },
      { name: 'EU roaming', valueType: 'boolean', productSpecCharacteristicValue: [{ value: true, isDefault: true }, { value: false }] },
      { name: 'Hotspot allowance', valueType: 'integer', productSpecCharacteristicValue: [{ valueFrom: '0', valueTo: '100', unitOfMeasure: 'GB' }] }
    ],
    attachment: [{ name: '5G coverage map', url: 'https://example.test/docs/5g-coverage.pdf', mimeType: 'application/pdf', attachmentType: 'document' }],
    resourceSpecification: [{ id: 'rs-sim', name: 'eSIM profile' }],
    validFor: { startDateTime: '2026-11-01T00:00:00Z' }
  },
  productOfferingPrice: {
    id: 'pop-5g-unlimited-monthly',
    name: '5G Unlimited monthly charge',
    priceType: 'recurring',
    recurringChargePeriodType: 'month',
    recurringChargePeriodLength: 1,
    isBundle: false,
    lifecycleStatus: 'Active',
    price: { unit: 'GBP', value: 30 },
    percentage: 0,
    unitOfMeasure: { amount: 1, units: 'month' },
    validFor: { startDateTime: '2026-11-01T00:00:00Z' },
    popRelationship: [{ id: 'pop-ff1000-discount', name: '50% off for 6 months', relationshipType: 'discount' }]
  },
  productOffering: {
    id: 'po-5g-unlimited-24',
    name: '5G Unlimited SIM-only 24 months',
    description: 'Unlimited 5G data, calls and texts, 24-month contract',
    isBundle: false,
    isSellable: true,
    lifecycleStatus: 'Active',
    version: '1.0',
    productSpecification: { id: 'ps-5g-mobile', href: `${BASE4}/productSpecification/ps-5g-mobile`, name: '5G Mobile Service' },
    productOfferingPrice: [{ id: 'pop-5g-unlimited-monthly', href: `${BASE4}/productOfferingPrice/pop-5g-unlimited-monthly`, name: '5G Unlimited monthly charge' }],
    category: [{ id: 'catg-sim-only', name: 'SIM-only Plans' }],
    channel: [{ id: 'ch-online', name: 'Online shop' }],
    productOfferingTerm: [{ name: '24-month contract', duration: { amount: 24, units: 'month' } }],
    prodSpecCharValueUse: [{
      name: 'Data allowance',
      valueType: 'string',
      productSpecCharacteristicValue: [{ value: 'Unlimited', isDefault: true }],
      productSpecification: { id: 'ps-5g-mobile' }
    }],
    validFor: { startDateTime: '2026-11-01T00:00:00Z' }
  }
};
