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
import { logger } from '@/lib/service/winston';

// Load .env.local
dotenvConfig({ path: resolve(process.cwd(), '.env.local') });

const promPort = parseInt(process.env.PORT as string) || 9464;
const promEndpoint = process.env.PROM_METRICS_ENDPOINT || '/metrics';
const promHost = process.env.PROM_METRICS_HOST || '0.0.0.0';

// Setup Prometheus Exporter for Application Metrics
const metricsExporter = new PrometheusExporter({
  port: promPort,
  endpoint: promEndpoint,
  host: promHost
});

logger.info(
  `Prometheus Exporter running at http://${promHost}:${promPort}${promEndpoint}`
);

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

const otlpExporterUrl =
  process.env.OTLP_TRACE_EXPORTER_URL || 'http://host.docker.internal:4317';
// Configure OTLP Trace Exporter using gRPC
const traceExporter = new OTLPTraceExporter({
  url: otlpExporterUrl // Send traces to Tempo via gRPC
});

tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
tracerProvider.register();

logger.info(`OTLP Trace Exporter running at ${otlpExporterUrl}`);

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
