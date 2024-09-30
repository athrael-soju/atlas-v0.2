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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Database,
  FileSearch,
  Cpu,
  Zap,
  ArrowRight,
  BarChart,
  Star
} from 'lucide-react';
import PageContainer from '@/components/layout/page-container';

export default function SettingsOverview() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'John Doe',
      company: 'AI Innovations',
      quote:
        'This RAG pipeline has revolutionized our information retrieval process.'
    },
    {
      name: 'Jane Smith',
      company: 'Tech Solutions',
      quote:
        'The semantic search capabilities are unparalleled. Highly recommended!'
    },
    {
      name: 'Alex Johnson',
      company: 'Data Dynamics',
      quote:
        "Implementing this RAG pipeline has significantly improved our AI model's performance."
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <PageContainer scrollable={true}>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            Advanced RAG Pipeline Overview
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Elevate your AI applications with our cutting-edge
            Retrieval-Augmented Generation pipeline, designed for superior
            performance and scalability.
          </p>
        </header>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Database className="h-8 w-8" />}
            title="Intelligent Document Ingestion"
            description="Process and index large volumes of documents with advanced NLP techniques for optimal retrieval efficiency."
          />
          <FeatureCard
            icon={<FileSearch className="h-8 w-8" />}
            title="Context-Aware Semantic Search"
            description="Utilize state-of-the-art embedding models and similarity algorithms to find the most relevant information based on context and meaning."
          />
          <FeatureCard
            icon={<Cpu className="h-8 w-8" />}
            title="Dynamic Context Integration"
            description="Seamlessly combine retrieved information with language model inputs, using adaptive techniques to enhance response quality and relevance."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Real-time Processing"
            description="Achieve lightning-fast query processing and response generation, optimized for low-latency applications."
          />
          <FeatureCard
            icon={<BarChart className="h-8 w-8" />}
            title="Advanced Analytics"
            description="Gain deep insights into your RAG pipeline's performance with comprehensive analytics and visualization tools."
          />
          <FeatureCard
            icon={<Star className="h-8 w-8" />}
            title="Customizable Pipeline"
            description="Tailor the RAG pipeline to your specific needs with modular components and easy integration options."
          />
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>RAG Process Visualization</CardTitle>
            <CardDescription>
              An in-depth look at our advanced RAG pipeline workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row">
              <ProcessStep
                icon={<Database className="mb-2 h-12 w-12" />}
                title="Document Ingestion"
                description="Efficient processing and indexing"
              />
              <ArrowRight className="hidden md:block" />
              <ProcessStep
                icon={<FileSearch className="mb-2 h-12 w-12" />}
                title="Semantic Retrieval"
                description="Context-aware information search"
              />
              <ArrowRight className="hidden md:block" />
              <ProcessStep
                icon={<Cpu className="mb-2 h-12 w-12" />}
                title="Context Integration"
                description="Dynamic content fusion"
              />
              <ArrowRight className="hidden md:block" />
              <ProcessStep
                icon={<Zap className="mb-2 h-12 w-12" />}
                title="Enhanced Generation"
                description="High-quality AI responses"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Key indicators of our RAG pipeline&rsquo;s exceptional performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Query Speed"
                value="50ms"
                description="Average response time"
              />
              <MetricCard
                title="Accuracy"
                value="95%"
                description="Information retrieval precision"
              />
              <MetricCard
                title="Scalability"
                value="10M+"
                description="Documents processed per hour"
              />
              <MetricCard
                title="User Satisfaction"
                value="4.8/5"
                description="Based on customer feedback"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is a RAG pipeline?</AccordionTrigger>
                <AccordionContent>
                  A RAG (Retrieval-Augmented Generation) pipeline is an AI
                  system that combines information retrieval with language
                  generation. It enhances AI models by providing relevant
                  context from a large corpus of documents, leading to more
                  accurate and informative responses.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  How does semantic search work in this pipeline?
                </AccordionTrigger>
                <AccordionContent>
                  Our semantic search utilizes advanced embedding techniques to
                  understand the context and meaning of both the query and the
                  stored documents. It goes beyond keyword matching to find
                  truly relevant information based on semantic similarity.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  Can this pipeline be integrated with existing systems?
                </AccordionTrigger>
                <AccordionContent>
                  Yes, our RAG pipeline is designed for easy integration. It
                  offers flexible APIs and connectors that allow seamless
                  incorporation into various AI applications, chatbots, and
                  knowledge management systems.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>What Our Clients Say</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="mb-4 text-lg">
                &quot;{testimonials[currentTestimonial].quote}&quot;
              </p>
              <p className="font-semibold">
                {testimonials[currentTestimonial].name}
              </p>
              <p className="text-sm text-muted-foreground">
                {testimonials[currentTestimonial].company}
              </p>
            </div>
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={prevTestimonial}
                className="mr-2"
              >
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={nextTestimonial}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">
            Ready to revolutionize your AI applications?
          </h2>
          <Button size="lg">
            Get Started Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

interface ProcessStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ProcessStep({ icon, title, description }: ProcessStepProps) {
  return (
    <div className="flex flex-col items-center">
      {icon}
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
}

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="mb-2 text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
