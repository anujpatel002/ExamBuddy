import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
// --- THIS IS THE FIX ---
// Import the class from the new, correct package
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
// ----------------------
import { MongoClient } from "mongodb";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017/exambuddy");
const dbName = "exambuddy";
const collectionName = "embeddings";
const collection = client.db(dbName).collection(collectionName);

export const createEmbeddingsForNote = async (noteId, textContent) => {
  try {
    console.log(`Starting embedding creation for note ${noteId}`);
    console.log(`Text content length: ${textContent?.length || 0}`);
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content provided for embedding creation');
    }
    
    await client.connect();
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 100 });
    const docs = await textSplitter.createDocuments([textContent]);
    console.log(`Created ${docs.length} document chunks`);

    const docsWithMetadata = docs.map(doc => ({
      ...doc,
      metadata: { ...doc.metadata, noteId: noteId.toString() }
    }));

    await MongoDBAtlasVectorSearch.fromDocuments(
      docsWithMetadata,
      new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY }),
      {
        collection,
        indexName: "default",
        textKey: "text",
        embeddingKey: "embedding",
      }
    );
    console.log(`Successfully created embeddings for note ${noteId}`);
  } catch (error) {
    console.error(`Failed to create embeddings for note ${noteId}:`, error);
    throw error;
  } finally {
    await client.close();
  }
};

export const findRelevantDocuments = async (noteId, query) => {
    try {
        await client.connect();
        const vectorStore = new MongoDBAtlasVectorSearch(
            new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY }),
            {
              collection,
              indexName: "default",
              textKey: "text",
              embeddingKey: "embedding",
            }
          );
    
        // First check if any embeddings exist for this note
        const allResults = await vectorStore.similaritySearch(query, 10);
        console.log(`Total embeddings found: ${allResults.length}`);
        
        // Filter by noteId manually
        const filteredResults = allResults.filter(result => 
            result.metadata && result.metadata.noteId === noteId.toString()
        );
        
        console.log(`Found ${filteredResults.length} relevant documents for noteId: ${noteId}`);
        
        if (filteredResults.length === 0) {
            // Check if embeddings exist at all for this note
            const embeddingCount = await collection.countDocuments({ 
                'metadata.noteId': noteId.toString() 
            });
            console.log(`Embedding count in DB for noteId ${noteId}: ${embeddingCount}`);
        }
        
        const context = filteredResults.map(result => result.pageContent).join('\n\n');
        console.log('Context length:', context.length);
        
        return context;
    } catch (error) {
        console.error(`Error finding relevant documents for noteId ${noteId}:`, error);
        return '';
    } finally {
        await client.close();
    }
};