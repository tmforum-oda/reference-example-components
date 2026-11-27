const opentelemetry = require('@opentelemetry/sdk-node')
const {getNodeAutoInstrumentations} = require('@opentelemetry/auto-instrumentations-node')
const {NodeTracerProvider} = require("@opentelemetry/sdk-trace-node")
const {OTLPTraceExporter} = require("@opentelemetry/exporter-trace-otlp-proto")
const {ConsoleSpanExporter} = require("@opentelemetry/sdk-trace-base")
const {Resource} = require("@opentelemetry/resources")
const {SemanticResourceAttributes} = require('@opentelemetry/semantic-conventions')
const {B3InjectEncoding, B3Propagator} = require("@opentelemetry/propagator-b3")
const {BatchSpanProcessor, SimpleSpanProcessor} = require("@opentelemetry/sdk-trace-base")
const {trace} = require('@opentelemetry/api')

// Log OpenTelemetry configuration
console.log('OpenTelemetry Configuration:')
console.log('OTL_EXPORTER_TRACE_PROTO_COLLECTOR_URL:', process.env.OTL_EXPORTER_TRACE_PROTO_COLLECTOR_URL)
console.log('OTL_EXPORTER_TRACE_PROTO_ENABLED:', process.env.OTL_EXPORTER_TRACE_PROTO_ENABLED)
console.log('OTL_EXPORTER_CONSOLE_ENABLED:', process.env.OTL_EXPORTER_CONSOLE_ENABLED)

const exporters = []

// Add OTLP exporter if enabled
if (process.env.OTL_EXPORTER_TRACE_PROTO_ENABLED !== 'false') {
    const otlpExporter = new OTLPTraceExporter({
        url: process.env.OTL_EXPORTER_TRACE_PROTO_COLLECTOR_URL
    })
    exporters.push(otlpExporter)
    console.log('OTLP trace exporter enabled')
}

// Add console exporter if enabled
if (process.env.OTL_EXPORTER_CONSOLE_ENABLED === 'true') {
    const consoleExporter = new ConsoleSpanExporter()
    exporters.push(consoleExporter)
    console.log('Console trace exporter enabled')
}

// Default to OTLP if no exporters specified
if (exporters.length === 0) {
    const defaultExporter = new OTLPTraceExporter({
        url: process.env.OTL_EXPORTER_TRACE_PROTO_COLLECTOR_URL
    })
    exporters.push(defaultExporter)
    console.log('Using default OTLP exporter')
}

const provider = new NodeTracerProvider({
    resource: Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.COMPONENT_NAME
      })
    )
})

// Add span processors for each exporter
exporters.forEach(exporter => {
    provider.addSpanProcessor(new BatchSpanProcessor(exporter))
})

provider.register({
    propagator: new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER })
})

trace.setGlobalTracerProvider(provider)

const sdk = new opentelemetry.NodeSDK({
    // Remove traceExporter since we're already handling exporters manually via the provider
    instrumentations: [getNodeAutoInstrumentations()]
})

sdk.start()

module.exports = {
    sdk,
    init() {}
}
