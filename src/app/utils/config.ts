export const config = {
    mongodb: {
      dbName: "hr_database",
      collectionName: "employees",
      vectorSearch: {
        indexName: "vector_index",
        textKey: "embedding_text",
        embeddingKey: "embedding"
      }
    },
    llm: {
      // modelName: "gpt-3.5-turbo-0125",
      // modelName: "gpt-4o-mini",
      modelName: "gpt-4o", // can correctly answer the question such as "How are our managers" and "who has the longest tenure with our company among all the current employees?" but are not able to answer the question such as "Please list all the employees sort by their most recent performance ratings from low to high."
      temperature: 0.7
    },
    server: {
      port: process.env.PORT || 3333
    }
  } as const;

  import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  RESET_DB: z.string().optional(),
});

export const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}; 