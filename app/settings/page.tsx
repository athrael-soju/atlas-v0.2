import PageContainer from '@/components/layout/page-container';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-8">
        {/* Settings Overview */}
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Settings Overview
          </h2>
          <Separator />

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Atlas offers a highly flexible and customizable system designed to
              optimize document processing and retrieval. Users can adjust
              various settings to ensure documents are handled with precision,
              from how they are parsed and partitioned to how they are chunked
              and retrieved. Selecting specific parsing providers allows users
              to tailor how documents are analyzed, particularly useful when
              dealing with complex or diverse data types. Partitioning
              strategies enable users to break down documents in ways that
              enhance data structure and improve search performance, ensuring
              more accurate results.
            </p>

            <p className="text-sm text-muted-foreground">
              Chunking techniques play a crucial role in determining how
              documents are divided into manageable units, impacting both
              storage and retrieval efficiency. With customizable chunk
              settings, Atlas lets users control the granularity of document
              divisions, ensuring the right balance between performance and
              search accuracy. Additionally, when working with semantic
              similarity searches, users can fine-tune how results are retrieved
              and filtered by adjusting parameters like the number of top
              results and the minimum relevance score. This ensures that only
              the most contextually relevant information is returned.
            </p>

            <p className="text-sm text-muted-foreground">
              Similarly, Pinecone Top K governs the number of top results
              retrieved from a vector database, balancing the need for broader
              search results with precision. Atlas provides further search
              customization through parameters like relevance thresholds and
              result limits. Features such as the &quot;Cohere Top N&quot; and
              &quot;Pinecone Top K&quot; settings allow users to fine-tune how
              search results are ranked and displayed. Together, these features
              make Atlas a versatile and adaptable tool, capable of enhancing
              retrieval precision and efficiency across various data needs.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full justify-center">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="forge">The Forge</TabsTrigger>
              <TabsTrigger value="knowledgebase">The Knowledgebase</TabsTrigger>
              <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="personal-info"
            >
              <AccordionItem value="personal-info">
                <AccordionTrigger>Personal Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Personal information is used to provide a more
                      personalized experience and improve the accuracy of search
                      results. By updating your profile settings, you enable
                      Atlas to tailor its responses and recommendations based on
                      your preferences, background, and needs.
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Atlas uses your profile details, such as your preferences,
                      language, and personal background, to create more relevant
                      and meaningful interactions. This may involve customizing
                      responses to align with your language choice, offering
                      suggestions based on your region or profession, and
                      ensuring that search results are more attuned to your
                      specific interests and circumstances.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Make sure to keep your profile information up to date to
                      ensure that Atlas continues to provide you with the most
                      relevant and personalized responses.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Forge Tab */}
          <TabsContent value="forge">
            <Accordion type="single" collapsible className="w-full">
              {/* Parsing Providers Accordion */}
              <AccordionItem value="parsing-providers">
                <AccordionTrigger>Parsing Providers</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Parsing providers are responsible for extracting and
                    structuring content from documents. This is a critical first
                    step in a RAG pipeline, as it ensures that unstructured data
                    like PDFs, Word documents, and images can be converted into
                    structured text that can be retrieved and analyzed.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We currently support <strong>Unstructured.io</strong> as a
                    parsing provider. This service is capable of handling a
                    variety of document types and formats, making it a versatile
                    choice for many RAG use cases.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Make sure to select a provider that aligns with your
                    document types and the complexity of your pipeline. For
                    image-heavy documents, a provider that supports Optical
                    Character Recognition (OCR) is essential.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Partitioning Strategies Accordion */}
              <AccordionItem value="partitioning-strategies">
                <AccordionTrigger>Partitioning Strategies</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Partitioning strategies control how a document is broken
                    into smaller, meaningful elements such as sections,
                    paragraphs, or images. In the context of a RAG pipeline,
                    this ensures that relevant chunks of information can be
                    retrieved efficiently based on user queries. Selecting the
                    right partitioning strategy is key for improving retrieval
                    precision and maintaining document structure.
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    <li>
                      <strong>Fast:</strong> This is a rule-based strategy that
                      quickly extracts text using basic NLP techniques.
                      It&apos;s useful for documents with a straightforward
                      structure, but may not handle images or complex layouts
                      well.
                    </li>
                    <li>
                      <strong>Hi Res:</strong> This model-based strategy takes
                      document layout into account, making it ideal for
                      documents where the relationship between elements is
                      important (e.g., forms, brochures). It provides higher
                      accuracy in complex documents.
                    </li>
                    <li>
                      <strong>Auto:</strong> Automatically selects the best
                      partitioning approach based on the document&apos;s content
                      and format. This is a good default option if you&apos;re
                      unsure about which strategy to choose.
                    </li>
                    <li>
                      <strong>OCR Only:</strong> Designed for image-based
                      documents, this strategy uses OCR to extract text from
                      scanned or image-heavy files. It&apos;s essential for
                      pipelines processing PDFs or other image-heavy formats.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    In a RAG pipeline, the partitioning strategy you choose
                    directly impacts the accuracy of the information retrieval
                    process. For text-based documents, &ldquo;Fast&rdquo; may
                    suffice, while for structured documents, &ldquo;Hi
                    Res&rdquo; will preserve layout integrity.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Chunking Strategies Accordion */}
              <AccordionItem value="chunking-strategies">
                <AccordionTrigger>Chunking Strategies</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Chunking strategies determine how the document content is
                    grouped into smaller &ldquo;chunks&rdquo; for retrieval and
                    processing. This step is crucial for RAG pipelines because
                    it allows the model to work with smaller, more relevant
                    pieces of information, improving the quality of the
                    generated answers by focusing on contextually relevant
                    content.
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    <li>
                      <strong>Basic:</strong> Combines elements sequentially,
                      respecting character limits for each chunk. This strategy
                      is effective for documents with a continuous flow of text.
                    </li>
                    <li>
                      <strong>By Title:</strong> Groups content based on section
                      titles, ensuring each chunk corresponds to a specific
                      section of the document. This is useful for
                      well-structured documents such as reports or manuals.
                    </li>
                    <li>
                      <strong>By Page:</strong> Ensures that chunks are created
                      based on page boundaries. This is ideal for documents
                      where maintaining page integrity is important (e.g., legal
                      documents).
                    </li>
                    <li>
                      <strong>By Similarity:</strong> Uses a machine learning
                      model to group content based on thematic similarity. This
                      is ideal for complex documents where related content might
                      be spread across different sections.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    For RAG pipelines, &quot;By Similarity&quot; can be
                    particularly useful when you want to retrieve chunks that
                    are thematically consistent with a query, whereas &quot;By
                    Title&quot; is better suited for documents with clearly
                    defined sections.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Chunk Settings Accordion */}
              <AccordionItem value="chunk-settings">
                <AccordionTrigger>Chunk Settings</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Chunk settings allow you to fine-tune how the document is
                    split into smaller pieces (chunks) for retrieval. These
                    settings are crucial for managing the size and overlap of
                    the chunks, ensuring the right amount of content is
                    processed efficiently for accurate retrieval and response
                    generation.
                  </p>
                  <ul className="list-decimal space-y-2 pl-5 text-sm">
                    <li>
                      <strong>Minimum Chunk Size:</strong> Set the minimum size
                      for each chunk (in characters). The value should be
                      between 0 and 1024, adjustable in steps of 256. A smaller
                      minimum size creates finer granularity but may increase
                      the number of chunks.
                    </li>
                    <li>
                      <strong>Maximum Chunk Size:</strong> Set the maximum size
                      for each chunk (in characters). This value should also be
                      between 0 and 1024, adjustable in steps of 256. Ensure the
                      maximum chunk size is greater than or equal to the minimum
                      chunk size.
                    </li>
                    <li>
                      <strong>Chunk Overlap:</strong> Specify the overlap
                      between consecutive chunks (in characters). This setting
                      controls how much content is shared between adjacent
                      chunks, which helps preserve context across chunks. The
                      value can range from 0 to 256.
                    </li>
                    <li>
                      <strong>Chunk Batch:</strong> Define the number of chunks
                      to process in a single batch. This value ranges from 50 to
                      150, adjustable in steps of 50. Increasing batch size can
                      improve processing speed but may require more
                      computational resources.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Ensure that the maximum chunk size is always larger than or
                    equal to the minimum chunk size to avoid errors. Adjusting
                    these settings can optimize your pipeline&apos;s
                    performance, balancing precision with processing time.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Instructions Accordion */}
              <AccordionItem value="instructions">
                <AccordionTrigger>How to Adjust Your Settings</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Follow these steps to fine-tune your RAG pipeline for
                    optimal document processing and retrieval:
                  </p>
                  <ol className="list-decimal space-y-2 pl-5 text-sm">
                    <li>
                      Choose a <strong>Parsing Provider</strong> that is best
                      suited for your document type (e.g., text-based or
                      image-based). This provider will handle converting
                      unstructured content into structured data.
                    </li>
                    <li>
                      Select a <strong>Partitioning Strategy</strong> to ensure
                      that documents are divided into meaningful elements,
                      facilitating better information retrieval later in the
                      pipeline.
                    </li>
                    <li>
                      Pick a <strong>Chunking Strategy</strong> that aligns with
                      your content structure. The way content is chunked plays a
                      significant role in how relevant information is retrieved
                      based on user queries.
                    </li>
                    <li>
                      Adjust the <strong>Chunk Settings</strong> such as
                      minimum/maximum chunk size, overlap, and batch processing
                      to fine-tune how your documents are split and processed.
                      These settings ensure efficient retrieval and response
                      generation in your pipeline.
                    </li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Knowledgebase Tab */}
          <TabsContent value="knowledgebase">
            <Accordion type="single" collapsible className="w-full">
              {/* Cohere Top N Accordion */}
              <AccordionItem value="cohere-top-n">
                <AccordionTrigger>Cohere Top N</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    The <strong>Cohere Top N</strong> parameter defines how many
                    of the top results you want to retrieve when performing a
                    semantic search using Cohere. Increasing this value can give
                    you a broader set of results, which can be useful in cases
                    where the initial top results might not fully capture the
                    answer you&apos;re looking for. However, setting it too high
                    may include less relevant results.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For example, setting this parameter to <strong>10</strong>{' '}
                    will return the top 10 most semantically similar results
                    from the knowledgebase. Fine-tune this value to balance
                    breadth and specificity in your retrieval.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Cohere Relevance Threshold Accordion */}
              <AccordionItem value="cohere-relevance-threshold">
                <AccordionTrigger>Cohere Relevance Threshold</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    The <strong>Cohere Relevance Threshold</strong> sets a
                    minimum relevance score for returned results. This score is
                    a percentage (0-100) indicating how closely the retrieved
                    result matches the query. A higher threshold ensures that
                    only highly relevant results are returned, but may also
                    exclude some useful results that are slightly less relevant.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For instance, if the threshold is set to <strong>80</strong>
                    , only results with a semantic similarity of 80% or higher
                    will be considered. Adjust this value to match the precision
                    level you need for your specific use case.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Pinecone Top K Accordion */}
              <AccordionItem value="pinecone-top-k">
                <AccordionTrigger>Pinecone Top K</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    The <strong>Pinecone Top K</strong> parameter controls how
                    many results are retrieved from the Pinecone vector database
                    based on their semantic similarity to the query. Pinecone
                    uses vector search to find the most relevant matches, and
                    this setting defines the number of matches to return.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For example, setting this parameter to <strong>500</strong>{' '}
                    will retrieve the top 500 results from the vector search.
                    Larger values can provide a broader set of results but may
                    also reduce the overall precision. Fine-tune this value
                    based on the size of your knowledgebase and the level of
                    granularity you need.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Instructions Accordion */}
              <AccordionItem value="instructions">
                <AccordionTrigger>
                  How to Adjust Your Knowledgebase Settings
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    To fine-tune your semantic similarity search, follow these
                    steps:
                  </p>
                  <ol className="list-decimal space-y-2 pl-5 text-sm">
                    <li>
                      Adjust the <strong>Cohere Top N</strong> to control how
                      many results you retrieve. Start with a moderate value
                      (e.g., 10) and adjust based on the breadth of results you
                      require.
                    </li>
                    <li>
                      Set the <strong>Cohere Relevance Threshold</strong> to
                      filter out less relevant results. A higher threshold
                      (e.g., 70-80) ensures you only get highly relevant
                      results, but you can lower this for broader searches.
                    </li>
                    <li>
                      Fine-tune the <strong>Pinecone Top K</strong> to balance
                      between the number of results and retrieval precision. Use
                      larger values for broad searches, or lower values for more
                      precise retrieval.
                    </li>
                  </ol>
                  <p className="text-sm text-muted-foreground">
                    Once configured, these settings will refine how your
                    knowledgebase retrieves and ranks results, ensuring your
                    semantic search is tailored to your needs.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Use Cases Tab */}
          <TabsContent value="use-cases">
            <Accordion type="single" collapsible className="w-full">
              {/* Legal Document Processing */}
              <AccordionItem value="legal-docs">
                <AccordionTrigger>
                  Legal Document Processing and Search
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    For law firms managing large volumes of legal documents
                    (e.g., contracts, case files), precision in document
                    retrieval is crucial to avoid missing relevant information
                    in high-stakes cases. The following settings help ensure
                    that searches are both comprehensive and efficient:
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    <li>
                      <strong>Parsing Provider:</strong> Unstructured.io – Known
                      for its reliability in processing complex, unstructured
                      legal documents.
                    </li>
                    <li>
                      <strong>Partitioning Strategy:</strong> Hi Res – Ensures
                      detailed partitioning, preserving the document&apos;s
                      structure, which is vital in legal contexts.
                    </li>
                    <li>
                      <strong>Chunking Strategy:</strong> By Page – Legal
                      documents often span many pages, and chunking by page
                      helps in maintaining context and clarity.
                    </li>
                    <li>
                      <strong>Chunk Overlap:</strong> 128 characters – Ensures
                      smooth transitions between chunks, minimizing the risk of
                      missing crucial information split between sections.
                    </li>
                    <li>
                      <strong>Top N:</strong> 5 – Focuses retrieval on the top 5
                      most relevant sections, reducing noise from less relevant
                      results.
                    </li>
                    <li>
                      <strong>Top K:</strong> 200 – Balances search speed with
                      comprehensive retrieval, pulling up to 200 candidate
                      chunks for relevance scoring.
                    </li>
                    <li>
                      <strong>Relevance Threshold:</strong> 85% – Ensures only
                      highly relevant information is surfaced, crucial for legal
                      accuracy.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    These settings ensure the retrieval of highly relevant legal
                    clauses or references while preserving the structural
                    integrity of the documents, minimizing the risk of missing
                    critical information.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Financial Report Analysis */}
              <AccordionItem value="financial-reports">
                <AccordionTrigger>Financial Report Analysis</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    For financial institutions analyzing structured reports like
                    balance sheets and earnings reports, accuracy and clarity
                    are key. These settings ensure that the system can handle
                    structured data effectively:
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    <li>
                      <strong>Parsing Provider:</strong> Unstructured.io –
                      Optimized for handling structured data such as financial
                      reports with tables and numerical data.
                    </li>
                    <li>
                      <strong>Partitioning Strategy:</strong> Auto –
                      Automatically adjusts to the report structure, preserving
                      sections like tables, figures, and titles.
                    </li>
                    <li>
                      <strong>Chunking Strategy:</strong> By Title – Financial
                      reports are often divided by title (e.g., &quot;Income
                      Statement&quot;), making this an ideal strategy for
                      breaking the report into meaningful chunks.
                    </li>
                    <li>
                      <strong>Chunk Overlap:</strong> 64 characters – Minimizes
                      overlap while ensuring that crucial transitions between
                      sections are not missed.
                    </li>
                    <li>
                      <strong>Top N:</strong> 10 – Returns the top 10 most
                      relevant sections, useful for detailed analysis without
                      overwhelming the user with too much data.
                    </li>
                    <li>
                      <strong>Top K:</strong> 500 – Ensures broad coverage of up
                      to 500 chunks, providing flexibility in retrieving data
                      across complex reports.
                    </li>
                    <li>
                      <strong>Relevance Threshold:</strong> 75% – A slightly
                      lower threshold ensures that the analysis covers both
                      highly relevant and potentially related financial data.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    These settings ensure that detailed financial information is
                    retrieved accurately while preserving the structure of the
                    reports, allowing analysts to focus on key financial metrics
                    efficiently.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Medical Research Papers Analysis */}
              <AccordionItem value="medical-research">
                <AccordionTrigger>
                  Medical Research Papers Analysis
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Medical researchers often need to sift through vast amounts
                    of research papers to gather the latest findings. These
                    settings optimize the search for relevant information while
                    maintaining a balance between coverage and accuracy:
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    <li>
                      <strong>Parsing Provider:</strong> Unstructured.io –
                      Effectively handles diverse and often complex research
                      papers, including scientific terminology and formatting.
                    </li>
                    <li>
                      <strong>Partitioning Strategy:</strong> Hi Res –
                      High-resolution partitioning allows for granular
                      processing of dense, data-heavy research papers.
                    </li>
                    <li>
                      <strong>Chunking Strategy:</strong> By Similarity – This
                      strategy ensures that similar sections of the text are
                      grouped together, facilitating cross-referencing between
                      related findings.
                    </li>
                    <li>
                      <strong>Chunk Overlap:</strong> 128 characters – Ensures
                      that key concepts spread across chunks are not missed,
                      providing a more cohesive search result.
                    </li>
                    <li>
                      <strong>Top N:</strong> 15 – Returns the top 15 relevant
                      research sections, offering a wide range of data for
                      comprehensive reviews.
                    </li>
                    <li>
                      <strong>Top K:</strong> 1000 – Casts a wide net by
                      searching up to 1000 candidate chunks, ensuring broad
                      coverage across multiple papers.
                    </li>
                    <li>
                      <strong>Relevance Threshold:</strong> 70% – A moderate
                      threshold allows for the inclusion of related studies,
                      even if their relevance is slightly lower, promoting
                      interdisciplinary insights.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    These settings provide a broad range of research results,
                    ensuring comprehensive reviews of medical literature while
                    maintaining relevance for research-driven fields.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* E-commerce Product Catalog Search */}
              <AccordionItem value="ecommerce-search">
                <AccordionTrigger>
                  E-commerce Product Catalog Search
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    For e-commerce platforms that require quick and relevant
                    product searches, these settings balance precision and
                    breadth to enhance product discovery:
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    <li>
                      <strong>Parsing Provider:</strong> Unstructured.io –
                      Efficient at handling diverse product descriptions and
                      metadata typical in e-commerce catalogs.
                    </li>
                    <li>
                      <strong>Partitioning Strategy:</strong> Fast – Prioritizes
                      speed without sacrificing too much detail, which is
                      crucial for real-time product search.
                    </li>
                    <li>
                      <strong>Chunking Strategy:</strong> By Title – Breaks the
                      catalog by product titles, ensuring that each search
                      result is distinct and focused.
                    </li>
                    <li>
                      <strong>Chunk Overlap:</strong> 64 characters – Small
                      overlap prevents excessive redundancy while still
                      capturing important product details.
                    </li>
                    <li>
                      <strong>Top N:</strong> 8 – Focuses on the top 8 most
                      relevant products, helping customers find what
                      they&apos;re looking for quickly.
                    </li>
                    <li>
                      <strong>Top K:</strong> 300 – Searches through 300 chunks
                      to cover a wide range of product variations and
                      attributes.
                    </li>
                    <li>
                      <strong>Relevance Threshold:</strong> 65% – A lower
                      threshold ensures that even less precisely matching
                      products are included, helping to cast a wider net for
                      product discovery.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    These settings retrieve the most relevant products, ensuring
                    an efficient and accurate product discovery process that
                    caters to user preferences.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Technical Manual Search */}
              <AccordionItem value="technical-manuals">
                <AccordionTrigger>
                  Technical Manual Search and Troubleshooting
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    For companies managing large volumes of technical manuals,
                    the following settings optimize searches for troubleshooting
                    steps or product specifications:
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    <li>
                      <strong>Parsing Provider:</strong> Unstructured.io – Ideal
                      for handling structured and semi-structured technical
                      documents with diagrams and detailed steps.
                    </li>
                    <li>
                      <strong>Partitioning Strategy:</strong> Auto –
                      Automatically adjusts based on document structure to
                      preserve formatting and content flow.
                    </li>
                    <li>
                      <strong>Chunking Strategy:</strong> By Title – Divides the
                      manual by section titles, allowing for focused retrieval
                      on specific parts like troubleshooting steps.
                    </li>
                    <li>
                      <strong>Chunk Overlap:</strong> 128 characters – Ensures
                      no critical information is lost when navigating between
                      sections, crucial for step-by-step instructions.
                    </li>
                    <li>
                      <strong>Top N:</strong> 6 – Surfaces the top 6 most
                      relevant steps or sections, minimizing distractions from
                      less pertinent information.
                    </li>
                    <li>
                      <strong>Top K:</strong> 400 – Searches across a wide range
                      of 400 sections to ensure comprehensive troubleshooting
                      guidance.
                    </li>
                    <li>
                      <strong>Relevance Threshold:</strong> 80% – Ensures high
                      relevance to avoid ambiguity in technical problem-solving.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    These settings ensure quick retrieval of specific technical
                    steps or troubleshooting guidance with high relevance,
                    making it easier for technicians and customers to solve
                    issues efficiently.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
