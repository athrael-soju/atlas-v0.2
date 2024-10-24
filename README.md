![image](https://github.com/user-attachments/assets/1ab5c771-133e-4585-8d0b-9cbb1f78f551)

# Welcome to Atlas

This platform acts as a starter template for building a knowledgebase and chatbot system. It's not perfect but it's a good starting point for building a more complex system.

# Process

## Authenticate using next-auth:

![image](https://github.com/user-attachments/assets/8ac2a949-a285-41ac-a018-71eb31b2e7c5)

## Upload a file to the uploadthing API and process:

![image](https://github.com/user-attachments/assets/085cc6c3-40c0-4f8c-b43b-875706023fce)

- Upload a file to the uploadthing API
  Process selected files in the knowledgebase UI to:
- Parse and chunk them into smaller pieces, using the Unstructured.io API, or Unstructured local container
- Embed the chunks using OpenAi text-embedding-3-large
- Store the embedded chunks in Pinecone Serverless, or Qdrant local container

## Query your knowledgebase

![image](https://github.com/user-attachments/assets/078f5cf4-85fb-4455-9183-d7bb62cb4a33)

- Proceed to the chat route and query your documents
- Each user message will go through the process of:
  - Embedding the message using OpenAi text-embedding-3-large
  - Perform a query to Pinecone Serverless, or Qdrant local container and retrieve the top K results
  - Rerank the results using Cohere's reranking model and return the top N result subset
  - Reranked chunks are used to enrich the user message and sent to OpenAi for a response

## Chat Options

- In the chat window, you can see the chat options on the bottom right of the screen
  ![image](https://github.com/user-attachments/assets/49091f8b-117c-488d-b436-ebe334b6fa59)

- Start a new conversation (You can view your conversations by clicking the chevron on the middle right of the screen)
- Save your conversation
- Switch to the Analysis Assistant, which uses the code Interpreter (This currently disables access to your knowledgebase)
- Speech is not currently implemented

## Settings / Personalization

- Select Settings
  ![image](https://github.com/user-attachments/assets/9575db8d-368e-400c-bbb0-75095fcdf054)
- You can now see the setings window, which allows you to customize the application
  ![image](https://github.com/user-attachments/assets/cbe60c4c-5a94-48df-bd4f-ce9ce356dba0)
- The Document Processing and Vectorization tabs in the Forge allow detailed customization of how the files get processed and stored in your knowledgebase.
  ![image](https://github.com/user-attachments/assets/89ed2b77-aafc-4729-97a6-6cd36dc025b2)
- The Knowledgebase settings allow customization of the response retrieval
  ![image](https://github.com/user-attachments/assets/683ab7bb-225a-43cf-b113-f584ba4d43fb)
- Finally, the Profile settings allow personalization of assistant responses, if enabled
  ![image](https://github.com/user-attachments/assets/3f74419a-ea09-400d-ba89-86d57e480468)
- You can switch your theme by clicking the highlighted button
  ![image](https://github.com/user-attachments/assets/a4f8a01b-1add-4586-a7ea-0716c1f302c5)

## Telemetry/Metrics

- If you've configured [grafana-alloy-example](https://github.com/athrael-soju/grafana-alloy-example), you can navigate to the Dashboard/Analytics tab. How and what you want to view in the Analytics Dashboard is highly configurable and covered in [grafana-alloy-example](https://github.com/athrael-soju/grafana-alloy-example)
  ![WhatsApp Image 2024-09-26 at 10 47 10_e02188a3](https://github.com/user-attachments/assets/762162b8-359c-44d3-9c0b-2e24b11144a7)

## Open source alternatives

You can use Qdrant and Unstructured local containers to replace Pinecone and Unstructured.io respectively, by deploying these containers and selecting the appropriate settings in the Forge.

```
services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    ports:
      - '6333:6333'
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      QDRANT__SERVICE__GRPC_PORT: 6334
      QDRANT__SERVICE__HTTP_PORT: 6333

  unstructured-api:
    image: downloads.unstructured.io/unstructured-io/unstructured-api:latest
    container_name: unstructured-api
    ports:
      - '8000:8000'
    depends_on:
      - qdrant

volumes:
  qdrant_data:
    driver: local
```

## UI Inspired by

<a href="https://github.com/Kiranism/next-shadcn-dashboard-starter.git">Shadcn Dashboard Starter</a>

That's it! Make sure to set all required environment variables before starting your application.
