# ODA Component List

Full list of standard TM Forum ODA Components from the v1.0.0 release at
https://github.com/tmforum-rand/TMForum-ODA-Ready-for-publication/tree/v1.0.0

## Specification URL Pattern

For each component, the specification YAML is at:
```
https://raw.githubusercontent.com/tmforum-rand/TMForum-ODA-Ready-for-publication/v1.0.0/{CODE}-{ShortName}/Specification/{CODE}-{ShortName}.yaml
```

Example:
```
https://raw.githubusercontent.com/tmforum-rand/TMForum-ODA-Ready-for-publication/v1.0.0/TMFC001-ProductCatalogManagement/Specification/TMFC001-ProductCatalogManagement.yaml
```

## Components

| Code | Short Name | Full Name |
|------|-----------|-----------|
| TMFC001 | ProductCatalogManagement | Product Catalog Management |
| TMFC002 | ProductOrderCaptureAndValidation | Product Order Capture And Validation |
| TMFC003 | ProductOrderDeliveryOrchestrationAndManagement | Product Order Delivery Orchestration And Management |
| TMFC005 | ProductInventory | Product Inventory |
| TMFC006 | ServiceCatalogManagement | Service Catalog Management |
| TMFC007 | ServiceOrderManagement | Service Order Management |
| TMFC008 | ServiceInventory | Service Inventory |
| TMFC009 | ServiceQualificationManagement | Service Qualification Management |
| TMFC010 | ResourceCatalogManagement | Resource Catalog Management |
| TMFC011 | ResourceOrderManagement | Resource Order Management |
| TMFC012 | ResourceInventory | Resource Inventory |
| TMFC014 | LocationManagement | Location Management |
| TMFC020 | DigitalIdentityManagement | Digital Identity Management |
| TMFC022 | PartyPrivacyManagement | Party Privacy Management |
| TMFC023 | PartyInteractionManagement | Party Interaction Management |
| TMFC024 | BillingAccountManagement | Billing Account Management |
| TMFC027 | ProductConfigurator | Product Configurator |
| TMFC028 | PartyManagement | Party Management |
| TMFC029 | PaymentManagement | Payment Management |
| TMFC030 | BillGeneration | Bill Generation |
| TMFC031 | BillCalculation | Bill Calculation |
| TMFC035 | PermissionsManagement | Permissions Management |
| TMFC036 | LeadAndOpportunityManagement | Lead And Opportunity Management |
| TMFC037 | ServicePerformanceManagement | Service Performance Management |
| TMFC038 | ResourcePerformanceManagement | Resource Performance Management |
| TMFC039 | AgreementManagement | Agreement Management |
| TMFC040 | ProductUsageManagement | Product Usage Management |
| TMFC041 | AnomalyManagement | Anomaly Management |
| TMFC043 | FaultManagement | Fault Management |
| TMFC046 | WorkforceManagement | Workforce Management |
| TMFC050 | ProductRecommendation | Product Recommendation |
| TMFC054 | ProductTestManagement | Product Test Management |
| TMFC055 | ServiceTestManagement | Service Test Management |
| TMFC061 | WorkOrderManagement | Work Order Management |
| TMFC062 | ResourceConfigurationandActivation | Resource Configuration and Activation |

## Functional Blocks

Components are grouped into functional blocks:
- **CoreCommerce**: TMFC001, TMFC002, TMFC003, TMFC005, TMFC027, TMFC036, TMFC050
- **Production**: TMFC006, TMFC007, TMFC008, TMFC009, TMFC010, TMFC011, TMFC012, TMFC054, TMFC055, TMFC061, TMFC062
- **PartyManagement**: TMFC020, TMFC022, TMFC023, TMFC028, TMFC035
- **Revenue**: TMFC024, TMFC029, TMFC030, TMFC031, TMFC040
- **Common**: TMFC014, TMFC039
- **IntelligenceManagement**: TMFC037, TMFC038, TMFC041, TMFC043, TMFC046

## Notes on Mapping

When constructing the specification URL, use the exact folder name from the GitHub repo. Most follow the pattern `{CODE}-{ShortName}`. To confirm the exact folder name, you can list them from the GitHub tree:
```
https://api.github.com/repos/tmforum-rand/TMForum-ODA-Ready-for-publication/contents/?ref=v1.0.0
```
