import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient, Collection } from "mongodb";
import { z } from "zod";
import "dotenv/config";
import { config } from "./config";
import { RateLimiter } from "limiter";

const createEmployeeLookupTool = (collection: Collection) =>
  tool(
    async ({ query, n = 10 }) => {
      console.log("Employee lookup tool called");
      const dbConfig = {
        collection: collection,
        indexName: "vector_index",
        textKey: "embedding_text",
        embeddingKey: "embedding",
      };

      const vectorStore = new MongoDBAtlasVectorSearch(
        new OpenAIEmbeddings(),
        dbConfig
      );

      const result = await vectorStore.similaritySearchWithScore(query, n ?? undefined);
      return JSON.stringify(result);
    },
    {
      name: "employee_lookup",
      description: "Gathers employee details from the HR database",
      schema: z.object({
        query: z.string().describe("The search query"),
        // Fix: Use nullable() with optional() to satisfy OpenAI API requirements
        n: z
          .number()
          .optional()
          .nullable()
          .default(10)
          .describe("Number of results to return"),
      }),
    }
  );

export async function callAgent(
  client: MongoClient,
  query: string,
  thread_id: string
): Promise<string> {
  try {
    // Ensure client is connected before proceeding
    try {
      await client.db("admin").command({ ping: 1 });
    } catch (err) {
      console.log("Client not connected, attempting to connect...");
      await client.connect();
    }

    // Define the MongoDB database and collection
    const dbName = config.mongodb.dbName;
    const db = client.db(dbName);
    const collection = db.collection(config.mongodb.collectionName);

    // Test the connection with a simple ping
    await db.admin().ping();
    console.log("MongoDB connection verified");

    const GraphState = Annotation.Root({
      messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
      }),
    });

    type GraphStateType = typeof GraphState.State;

    const employeeLookupTool = createEmployeeLookupTool(collection);
    const tools = [employeeLookupTool];

    // We can extract the state typing via `GraphState.State`
    const toolNode = new ToolNode<GraphStateType>(tools);

    const model = new ChatOpenAI({
      modelName: config.llm.modelName,
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).bindTools(tools);

    async function callModel(state: GraphStateType) {
      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `You are a helpful AI assistant, collaborating with other assistants. Use the provided tools to progress towards answering the question. If you are unable to fully answer, that's OK, another assistant with different tools will help where you left off. Execute what you can to make progress. If you or any of the other assistants have the final answer or deliverable, prefix your response with FINAL ANSWER so the team knows to stop. You have access to the following tools: {tool_names}.\n{system_message}\nCurrent time: {time}.`,
        ],
        new MessagesPlaceholder("messages"),
      ]);

      const formattedPrompt = await prompt.formatMessages({
        system_message: "You are helpful HR Chatbot Agent.",
        time: new Date().toISOString(),
        tool_names: tools.map((tool) => tool.name).join(", "),
        messages: state.messages,
      });

      const result = await model.invoke(formattedPrompt);
      return { messages: [result] };
    }

    function shouldContinue(state: GraphStateType) {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1] as AIMessage;

      // If the LLM makes a tool call, then we route to the "tools" node
      if (lastMessage.tool_calls?.length) {
        return "tools";
      }
      // Otherwise, we stop (reply to the user)
      return "__end__";
    }

    const workflow = new StateGraph(GraphState)
      .addNode("agent", callModel)
      .addNode("tools", toolNode)
      .addEdge("__start__", "agent")
      .addConditionalEdges("agent", shouldContinue)
      .addEdge("tools", "agent");

    const checkpointer = new MongoDBSaver({ client, dbName });
    const app = workflow.compile({ checkpointer });

    const finalState = await app.invoke(
      {
        messages: [new HumanMessage(query)],
      },
      { recursionLimit: 15, configurable: { thread_id: thread_id } }
    );

    console.log(finalState.messages[finalState.messages.length - 1].content);
    return String(finalState.messages[finalState.messages.length - 1].content);
  } catch (error) {
    console.error('Agent error:', error);
    return "I apologize, but I encountered an error processing your request. Please try again.";
  }
  // Fix: Remove the client.close() call - let the connection pool handle this
  // The client should remain open for the connection pool to manage
}

const rateLimiter = new RateLimiter({ tokensPerInterval: 20, interval: 'minute' }); // 20 tokens per minute