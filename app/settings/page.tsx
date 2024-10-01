'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Database,
  Cpu,
  Zap,
  ArrowRight,
  BarChart2
} from 'lucide-react';
import PageContainer from '@/components/layout/page-container';

export default function Component() {
  const [embeddingModel, setEmbeddingModel] = useState('bert-base-uncased');
  const [retrievalMethod, setRetrievalMethod] = useState('bm25');
  const [topK, setTopK] = useState(5);
  const [useReranking, setUseReranking] = useState(false);
  const [contextWindow, setContextWindow] = useState(1000);

  return (
    <PageContainer scrollable={true}>
      <div className="flex h-screen flex-col">
        <header className="bg-background py-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            RAG Pipeline Configuration
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Optimize your Retrieval-Augmented Generation pipeline with these
            advanced settings
          </p>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="retrieval" className="mb-12">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="retrieval">Retrieval</TabsTrigger>
              <TabsTrigger value="embedding">Embedding</TabsTrigger>
              <TabsTrigger value="generation">Generation</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="retrieval">
              <Card>
                <CardHeader>
                  <CardTitle>Retrieval Settings</CardTitle>
                  <CardDescription>
                    Configure how documents are retrieved from your knowledge
                    base
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Retrieval Method
                    </label>
                    <Select
                      value={retrievalMethod}
                      onValueChange={setRetrievalMethod}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select retrieval method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bm25">BM25</SelectItem>
                        <SelectItem value="tfidf">TF-IDF</SelectItem>
                        <SelectItem value="dense">Dense Retrieval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Top K Documents
                    </label>
                    <Slider
                      min={1}
                      max={20}
                      step={1}
                      value={[topK]}
                      onValueChange={(value) => setTopK(value[0])}
                    />
                    <p className="text-sm text-muted-foreground">
                      Current value: {topK}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-reranking"
                      checked={useReranking}
                      onCheckedChange={setUseReranking}
                    />
                    <label
                      htmlFor="use-reranking"
                      className="text-sm font-medium"
                    >
                      Use Reranking
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="embedding">
              <Card>
                <CardHeader>
                  <CardTitle>Embedding Settings</CardTitle>
                  <CardDescription>
                    Choose and configure your embedding model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Embedding Model
                    </label>
                    <Select
                      value={embeddingModel}
                      onValueChange={setEmbeddingModel}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select embedding model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bert-base-uncased">
                          BERT (base uncased)
                        </SelectItem>
                        <SelectItem value="roberta-base">
                          RoBERTa (base)
                        </SelectItem>
                        <SelectItem value="distilbert-base-uncased">
                          DistilBERT (base uncased)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="generation">
              <Card>
                <CardHeader>
                  <CardTitle>Generation Settings</CardTitle>
                  <CardDescription>
                    Configure the language model for response generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Context Window Size
                    </label>
                    <Slider
                      min={100}
                      max={2000}
                      step={100}
                      value={[contextWindow]}
                      onValueChange={(value) => setContextWindow(value[0])}
                    />
                    <p className="text-sm text-muted-foreground">
                      Current value: {contextWindow} tokens
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Fine-tune your RAG pipeline for optimal performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch id="use-cache" />
                    <label htmlFor="use-cache" className="text-sm font-medium">
                      Enable Query Cache
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="use-streaming" />
                    <label
                      htmlFor="use-streaming"
                      className="text-sm font-medium"
                    >
                      Enable Response Streaming
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Configuration Impact</CardTitle>
              <CardDescription>
                How different settings affect your RAG pipeline performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ConfigImpactCard
                  icon={<Search className="h-8 w-8" />}
                  title="Retrieval Precision"
                  description="Higher Top K and Reranking improve relevance but may increase latency."
                />
                <ConfigImpactCard
                  icon={<Database className="h-8 w-8" />}
                  title="Index Size"
                  description="More complex embedding models increase index size but can improve semantic understanding."
                />
                <ConfigImpactCard
                  icon={<Cpu className="h-8 w-8" />}
                  title="Computational Load"
                  description="Advanced retrieval methods and larger context windows increase computational requirements."
                />
                <ConfigImpactCard
                  icon={<Zap className="h-8 w-8" />}
                  title="Response Time"
                  description="Caching and streaming can significantly reduce response times for repeated queries."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Real-time metrics based on your current configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Avg. Query Time"
                  value="120ms"
                  icon={<BarChart2 className="h-4 w-4" />}
                />
                <MetricCard
                  title="Retrieval Accuracy"
                  value="92%"
                  icon={<Search className="h-4 w-4" />}
                />
                <MetricCard
                  title="Index Size"
                  value="2.5GB"
                  icon={<Database className="h-4 w-4" />}
                />
                <MetricCard
                  title="Cache Hit Rate"
                  value="75%"
                  icon={<Zap className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>

          <div className="pb-8 text-center">
            <h2 className="mb-4 text-2xl font-bold">
              Ready to apply your optimized configuration?
            </h2>
            <Button size="lg">
              Apply Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

interface ConfigImpactCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ConfigImpactCard({ icon, title, description }: ConfigImpactCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className="mr-4">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center">
          {icon}
          <h3 className="ml-2 font-semibold">{title}</h3>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
