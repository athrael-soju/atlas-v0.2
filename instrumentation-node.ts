import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import {
  Resource,
  detectResourcesSync,
  envDetector,
  hostDetector,
  processDetector
} from '@opentelemetry/resources';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';

// Load .env.local
dotenvConfig({ path: resolve(process.cwd(), '.env.local') });

// Setup Prometheus Exporter for Application Metrics
const metricsExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
  host: '0.0.0.0' // Listen on all network interfaces
});

console.info('Prometheus metrics exposed at http://localhost:9464/metrics');

// Detect Resources (e.g., environment details)
const detectedResources = detectResourcesSync({
  detectors: [envDetector, processDetector, hostDetector]
});
const customResources = new Resource({});

const resources = detectedResources.merge(customResources);

// Setup MeterProvider for Application Metrics
const meterProvider = new MeterProvider({
  readers: [metricsExporter],
  resource: resources
});

// Setup TracerProvider for Tracing
const tracerProvider = new NodeTracerProvider({
  resource: resources
});

// Configure OTLP Trace Exporter using gRPC
const traceExporter = new OTLPTraceExporter({
  url: 'http://host.docker.internal:4317' // Send traces to Tempo via gRPC
});

tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
tracerProvider.register();

console.info(
  'TracerProvider registered and sending traces to Tempo at http://host.docker.internal:4317'
);

// Register Instrumentations for HTTP and Runtime metrics
registerInstrumentations({
  tracerProvider,
  meterProvider,
  instrumentations: [
    new HttpInstrumentation(), // Automatically trace HTTP requests (including Next.js)
    new RuntimeNodeInstrumentation() // Capture runtime metrics for the application (e.g., memory usage)
  ]
});

// No host metrics collected here; Node Exporter handles system-level metrics
