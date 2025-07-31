import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { z } from "zod";
import "dotenv/config";
import { config } from "./config";
import clientPromise from './mongodb';

const EmployeeSchema = z.object({
  employee_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }),
  contact_details: z.object({
    email: z.string().email(),
    phone_number: z.string(),
  }),
  job_details: z.object({
    job_title: z.string(),
    department: z.string(),
    hire_date: z.string(),
    employment_type: z.string(),
    salary: z.number(),
    currency: z.string(),
  }),
  work_location: z.object({
    nearest_office: z.string(),
    is_remote: z.boolean(),
  }),
  reporting_manager: z.string().nullable(),
  skills: z.array(z.string()),
  performance_reviews: z.array(
    z.object({
      review_date: z.string(),
      rating: z.number(),
      comments: z.string(),
    })
  ),
  benefits: z.object({
    health_insurance: z.string(),
    retirement_plan: z.string(),
    paid_time_off: z.number(),
  }),
  emergency_contact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone_number: z.string(),
  }),
  notes: z.string(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

const parser = StructuredOutputParser.fromZodSchema(z.array(EmployeeSchema));

async function generateSyntheticData(): Promise<Employee[]> {
  // Get all top-level field names from the schema
  const fields = Object.keys(EmployeeSchema.shape);
  
  const prompt = `You are a helpful assistant that generates employee data. Generate 10 fictional employee records.
Each record should include all the following fields: ${fields.join(', ')}.
Ensure variety in the data and realistic values.
${parser.getFormatInstructions()}`;
  
  console.log("Generating synthetic data...");
  const response = await llm.invoke(prompt);
  console.log("Raw LLM response:", response.content);
  return parser.parse(response.content as string);
}

function createEmployeeSummary(employee: Employee): string {
  const jobDetails = `${employee.job_details.job_title} in ${employee.job_details.department}`;
  const skills = employee.skills.join(", ");
  const performanceReviews = employee.performance_reviews
    .map(
      (review) =>
        `Rated ${review.rating} on ${review.review_date}: ${review.comments}`
    )
    .join(" ");
  const basicInfo = `${employee.first_name} ${employee.last_name}, born on ${employee.date_of_birth}`;
  const workLocation = `Works at ${employee.work_location.nearest_office}, Remote: ${employee.work_location.is_remote}`;
  const notes = employee.notes;

  return `${basicInfo}. Job: ${jobDetails}. Skills: ${skills}. Reviews: ${performanceReviews}. Location: ${workLocation}. Notes: ${notes}`;
}

const llm = new ChatOpenAI({
    modelName: config.llm.modelName,
    temperature: 0.7,
  });

async function pingDatabase(): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db(config.mongodb.dbName);
    const collection = db.collection(config.mongodb.collectionName);

    console.log(
      "Database seeded successfully to db",
      db.databaseName,
      "collection",
      collection.collectionName
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

export async function seedDatabase(): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db(config.mongodb.dbName);
    const collection = db.collection(config.mongodb.collectionName);

    // Only delete if explicitly requested
    const shouldReset = process.env.RESET_DB === 'true';
    if (shouldReset) {
      console.log('Resetting database...');
      await collection.deleteMany({});
    }

    const syntheticData = await generateSyntheticData();

    const recordsWithSummaries = syntheticData.map((record) => ({
      pageContent: createEmployeeSummary(record),
      metadata: { ...record },
    }));

    // Create vector store instance
    const vectorStore = new MongoDBAtlasVectorSearch(new OpenAIEmbeddings(), {
      collection,
      ...config.mongodb.vectorSearch
    });

    // Add all documents at once instead of one by one
    await vectorStore.addDocuments(recordsWithSummaries);
    console.log("Successfully processed & saved all records");

    console.log("Database seeding completed");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

export async function searchEmployees(query: string): Promise<Employee[]> {
  try {
    const client = await clientPromise;
    const db = client.db(config.mongodb.dbName);
    const collection = db.collection(config.mongodb.collectionName);

    const vectorStore = new MongoDBAtlasVectorSearch(new OpenAIEmbeddings(), {
      collection,
      ...config.mongodb.vectorSearch
    });

    console.log(`Searching for: "${query}"`);
    const results = await vectorStore.similaritySearch(query);

    results.forEach((result, index) => {
      console.log(`\nMatch ${index + 1}:`);
      console.log("Content:", result.pageContent);
      console.log("Employee ID:", result.metadata.employee_id);
    });

    return results.map(result => result.metadata as Employee);
  } catch (error) {
    console.error("Error searching employees:", error);
    return [];
  }
}

// Example searches
async function runExampleSearches(): Promise<void> {
  const queries = [
    "experienced software engineers who know Python",
    "remote workers in the marketing department",
    "employees with high performance ratings",
  ];

  for (const query of queries) {
    await searchEmployees(query);
    console.log("\n-------------------\n");
  }
}

export async function cleanupDatabase(): Promise<void> {
  const client = await clientPromise;
  try {
    await client.db(config.mongodb.dbName).collection(config.mongodb.collectionName).deleteMany({});
  } catch (error) {
    console.error("Error cleaning database:", error);
    throw error;
  }
}