
# Application Setup Instructions

## OpenTelemetry Collector

1. Set up OpenTelemetry Collector:
   - Docker Image: `otel/opentelemetry-collector:0.67.0`
   - You can customize arguments using the `OTELCOL_ARGS` variable.

## NextAuth

1. Configure GitHub OAuth:
   - Go to [GitHub Developers](https://github.com/settings/developers) to set up a new OAuth app.
   - Follow the guide on [NextAuth GitHub Provider](https://next-auth.js.org/providers/github#configuration).

2. Google OAuth:
   - Follow the NextAuth [Google Provider guide](https://next-auth.js.org/providers/google).

3. Set your environment variables:
   ```bash
   GITHUB_ID=
   GITHUB_SECRET=
   GOOGLE_ID=
   GOOGLE_SECRET=
   NEXTAUTH_URL=http://localhost:3000/
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   ```

## Uploadthing

1. Configure Uploadthing for file uploads:
   - Visit [Uploadthing](https://uploadthing.com/) for API setup.
   - Set the following environment variables:
   ```bash
   UPLOADTHING_SECRET=
   UPLOADTHING_APP_ID=
   ```

## OpenAI

1. Configure OpenAI API for use:
   - Get your API key from the [OpenAI Dashboard](https://beta.openai.com/).
   - Set the following environment variables:
   ```bash
   OPENAI_API_KEY=
   OPENAI_ASSISTANT_ID=
   OPENAI_API_EMBEDDING_MODEL=text-embedding-3-large
   ```

## MongoDB

1. Configure MongoDB:
   - Use your MongoDB connection URI in the following environment variable:
   ```bash
   MONGODB_URI=
   ```
   - Set the environment mode:
   ```bash
   NODE_ENV='development'
   ```

## Unstructured.io

1. Configure Unstructured.io for data parsing & chunking:
   - Visit [Unstructured.io](https://unstructured.io/) to obtain the API key and set it as:
   ```bash
   UNSTRUCTURED_API=
   UNSTRUCTURED_SERVER_URL=https://api.unstructuredapp.io
   ```

## Pinecone (Semantic Search)

1. Configure Pinecone for serverless semantic search:
   - Get your Pinecone API key and index from [Pinecone](https://www.pinecone.io/).
   - Set the following environment variables:
   ```bash
   PINECONE_API=
   PINECONE_INDEX=atlasii
   ```

## Cohere (Reranking)

1. Set up Cohere API for reranking:
   - Visit [Cohere](https://cohere.ai/) for the API key and model.
   - Set the following environment variables:
   ```bash
   COHERE_API_KEY=
   COHERE_API_MODEL=rerank-multilingual-v3.0
   ```

## Upstash (Redis)

1. Configure Upstash Redis:
   - Get your Upstash Redis URL from the [Upstash dashboard](https://upstash.com/).
   - Set the following environment variable:
   ```bash
   UPSTASH_REDIS_REST_URL=
   ```
## Inspired by
<a href="https://github.com/Kiranism/next-shadcn-dashboard-starter.git">Shadcn Dashboard Starter</a>

That's it! Make sure to set all required environment variables before starting your application.
