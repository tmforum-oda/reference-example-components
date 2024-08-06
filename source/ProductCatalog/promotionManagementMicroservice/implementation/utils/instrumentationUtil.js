const opentelemetry = require('@opentelemetry/sdk-node')
const {getNodeAutoInstrumentations} = require('@opentelemetry/auto-instrumentations-node')
const {NodeTracerProvider} = require("@opentelemetry/sdk-trace-node")
const {OTLPTraceExporter} = require("@opentelemetry/exporter-trace-otlp-proto")
const {Resource} = require("@opentelemetry/resources")
const {SemanticResourceAttributes} = require('@opentelemetry/semantic-conventions')
const {B3InjectEncoding, B3Propagator} = require("@opentelemetry/propagator-b3")
const {BatchSpanProcessor, SimpleSpanProcessor} = require("@opentelemetry/sdk-trace-base")
const {trace} = require('@opentelemetry/api')

const exporter = new OTLPTraceExporter({
    url: process.env.OTL_EXPORTER_TRACE_PROTO_COLLECTOR_URL
})

const provider = new NodeTracerProvider({
    resource: Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.COMPONENT_NAME
      })
    )
})

provider.addSpanProcessor(new BatchSpanProcessor(exporter))
provider.addSpanProcessor(new SimpleSpanProcessor())
provider.register({
    propagator: new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER })
})

trace.setGlobalTracerProvider(provider)

const sdk = new opentelemetry.NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()]
})

sdk.start()

module.exports = {
    sdk,
    init() {}
}
