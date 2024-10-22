![image](https://github.com/user-attachments/assets/beb5faea-beda-4ea8-b342-56145d037810)

# Atlas Setup Instructions

## Introduction

This application is a robust, multi-functional platform designed to integrate a wide range of services and features using a modern tech stack. Its primary capabilities are centered around user authentication, file uploads, semantic search, and advanced AI-driven functionalities. Here's a breakdown of its key features and functionalities:

### Key Capabilities

#### OpenTelemetry Monitoring

The app uses OpenTelemetry Collector to track and monitor system performance and events. By using OpenTelemetry, it can provide deep insights into performance metrics and distributed tracing, allowing developers to troubleshoot and optimize system performance.

#### OAuth-based Authentication (NextAuth)

The application supports secure authentication via GitHub and Google using NextAuth.js. This provides users with flexible sign-in options through their existing accounts on popular platforms, ensuring secure and seamless access.
With environment variables configured for GitHub and Google OAuth, developers can easily customize authentication for different environments (development, staging, production).

#### File Uploads with Uploadthing

The integration of Uploadthing allows users to seamlessly upload files into the platform. The files can be uploaded directly via the front-end, and the data is handled securely via API calls, simplifying file management.

#### AI-Powered Features (OpenAI Integration)

The app integrates OpenAI's GPT models, providing powerful AI capabilities, including text generation, embeddings, and more. With this integration, the application can enable features like intelligent assistants, content creation, and advanced NLP (natural language processing) capabilities.

#### Database Management with MongoDB

For data persistence, the app uses MongoDB, a powerful NoSQL database that supports high flexibility and scalability. Developers can store user data, session information, and other records securely, ensuring the app can scale effortlessly with user growth.

#### Data Processing with Unstructured.io

With the Unstructured.io integration, the app can process and parse unstructured data, making it easier to extract meaningful information from complex datasets. This is particularly useful for tasks like document parsing, PDF reading, and text analysis.

#### Semantic Search with Pinecone

The app offers semantic search capabilities using Pinecone. This feature allows users to search through large datasets using embeddings, ensuring fast and accurate search results for complex queries. It enhances the user experience by improving the relevancy of search outcomes.

#### Reranking with Cohere

The application also integrates Cohere to perform reranking of search results. Using Cohere’s multilingual reranking model, the app ensures that search results are not only relevant but also contextually accurate and ranked in a way that provides the best user experience.

#### Caching and Storage with Upstash Redis

Redis caching is handled via Upstash, which offers serverless Redis storage. By using this feature, the application can maintain fast data access and reduce the load on the database, improving performance and scaling capabilities.

### Use Cases

- **User Authentication**: Secure and fast login/signup with GitHub and Google accounts.
- **File Management**: Upload, manage, and retrieve files effortlessly using Uploadthing.
- **AI-Powered Assistance**: Leverage OpenAI’s models to provide smart suggestions, content generation, and interactive AI-driven tasks.
- **Advanced Search**: Perform powerful semantic searches on large datasets with Pinecone and get reranked results using Cohere for increased accuracy.
- **Real-Time Monitoring**: Keep track of system metrics and performance using OpenTelemetry.
- **Data Parsing**: Automate the extraction and processing of unstructured data through Unstructured.io.

This platform acts as a starter framework for building modern applications that require seamless user experiences, integrated machine learning features, and robust cloud services. Developers can customize the stack and scale features to fit a variety of application needs.

## OpenTelemetry Collector

1. Set up OpenTelemetry Collector:

   - Docker Image: `otel/opentelemetry-collector:0.67.0`
   - You can customize arguments using the `OTELCOL_ARGS` variable.

   ```bash
   docker run -p 4317:4317 -p 4318:4318 otel/opentelemetry-collector:0.67.0
   ```

2. Example configuration file:
   You can define your own configuration for the collector by mounting it via Docker.

## NextAuth

1. Configure GitHub OAuth:
   - Go to [GitHub Developers](https://github.com/settings/developers) to set up a new OAuth app.
   - Follow the guide on [NextAuth GitHub Provider](https://next-auth.js.org/providers/github#configuration).
2. Google OAuth:

   - Follow the NextAuth [Google Provider guide](https://next-auth.js.org/providers/google).

3. Set your environment variables:

   ```bash
   GITHUB_ID=your_github_id
   GITHUB_SECRET=your_github_secret
   GOOGLE_ID=your_google_id
   GOOGLE_SECRET=your_google_secret
   NEXTAUTH_URL=http://localhost:3000/
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   ```

4. Run NextAuth in development mode:
   ```bash
   npm run dev
   ```

## Uploadthing

1. Configure Uploadthing for file uploads:

   - Visit [Uploadthing](https://uploadthing.com/) for API setup.
   - Set the following environment variables:

   ```bash
   UPLOADTHING_SECRET=your_uploadthing_secret
   UPLOADTHING_APP_ID=your_uploadthing_app_id
   ```

2. Initialize Uploadthing in your app:

   ```js
   import { UploadButton } from 'uploadthing/react';

   <UploadButton />;
   ```

## OpenAI

1. Configure OpenAI API for use:

   - Get your API key from the [OpenAI Dashboard](https://beta.openai.com/).
   - Set the following environment variables:

   ```bash
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_ASSISTANT_ID=your_openai_assistant_id
   OPENAI_API_EMBEDDING_MODEL=text-embedding-3-large
   ```

## MongoDB

1. Configure MongoDB:

   - Use your MongoDB connection URI in the following environment variable:

   ```bash
   MONGODB_URI=your_mongodb_uri
   ```

2. Set the environment mode:

   ```bash
   NODE_ENV='development'
   ```

3. Run the MongoDB service locally or in Docker:

   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

## Unstructured.io

1. Configure Unstructured.io for data parsing & chunking:

   - Visit [Unstructured.io](https://unstructured.io/) to obtain the API key and set it as:

   ```bash
   UNSTRUCTURED_API=your_unstructured_api_key
   UNSTRUCTURED_SERVER_URL=https://api.unstructuredapp.io
   ```

## Pinecone (Semantic Search)

1. Configure Pinecone for serverless semantic search:

   - Get your Pinecone API key and index from [Pinecone](https://www.pinecone.io/).
   - Set the following environment variables:

   ```bash
   PINECONE_API=your_pinecone_api_key
   PINECONE_INDEX=atlasv0.2
   ```

2. Use the Pinecone client in your app:

   ```js
   import { PineconeClient } from '@pinecone-database/client';

   const client = new PineconeClient({
     apiKey: process.env.PINECONE_API,
     environment: process.env.PINECONE_INDEX
   });
   ```

## Cohere (Reranking)

1. Set up Cohere API for reranking:

   - Visit [Cohere](https://cohere.ai/) for the API key and model.
   - Set the following environment variables:

   ```bash
   COHERE_API_KEY=your_cohere_api_key
   COHERE_API_MODEL=rerank-multilingual-v3.0
   ```

2. Example usage in reranking:

   ```js
   const response = await cohere.rerank({
     model: process.env.COHERE_API_MODEL,
     query: 'your search query',
     documents: ['doc1', 'doc2', 'doc3']
   });
   ```

## Upstash (Redis)

1. Configure Upstash Redis:

   - Get your Upstash Redis URL from the [Upstash dashboard](https://upstash.com/).
   - Set the following environment variable:

   ```bash
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   ```

2. Use Upstash Redis in your app:

   ```js
   import { Redis } from '@upstash/redis';

   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL,
     token: process.env.UPSTASH_REDIS_REST_TOKEN
   });
   ```

## Prometheus & Grafana Setup

You can integrate **Prometheus** for system metrics monitoring and **Grafana** for visualization. The following `docker-compose` configuration sets up both services:

```yaml
services:
  prometheus:
    container_name: prometheus
    image: prom/prometheus:latest
    restart: always
    volumes:
      - ./prometheus.yaml:/etc/prometheus/prometheus.yml
    ports:
      - '9090:9090'
    networks:
      - atlas-network
  grafana:
    container_name: grafana
    image: grafana/grafana:latest
    ports:
      - '4000:3000'
    depends_on:
      - prometheus
    networks:
      - atlas-network
networks:
  atlas-network:
    driver: bridge
```

## Inspired by

<a href="https://github.com/Kiranism/next-shadcn-dashboard-starter.git">Shadcn Dashboard Starter</a>

That's it! Make sure to set all required environment variables before starting your application.
