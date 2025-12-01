// controllers/chatbotController.js

// ==============================
// 📌 Imports
// ==============================
const natural = require('natural');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// ==============================
// 📌 TF-IDF (existing logic)
// ==============================
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// ==============================
// 📌 Dataset Store
// ==============================
let healthcareDataset = [];
let isDatasetLoaded = false;

// ==============================
// 📌 Semantic RAG (Embeddings)
// ==============================

// In-memory embedding index: [{ vector: number[], item }]
let embeddingIndex = [];
let areEmbeddingsReady = false;

// Lazy-loaded embeddings model
let embeddingsModelPromise = null;

/**
 * Get / load the embeddings model from @xenova/transformers
 * Uses all-MiniLM-L6-v2 which is small & good for sentence similarity.
 */
async function getEmbeddingsModel() {
  if (!embeddingsModelPromise) {
    const { pipeline } = await import('@xenova/transformers');
    embeddingsModelPromise = pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('🧠 Loaded embeddings model (all-MiniLM-L6-v2)');
  }
  return embeddingsModelPromise;
}

/**
 * Convert a text string into a numeric vector using the embeddings model.
 */
async function embedText(text) {
  const model = await getEmbeddingsModel();
  const output = await model(text, { pooling: 'mean', normalize: true });
  // output.data is a Float32Array
  return Array.from(output.data);
}

/**
 * Cosine similarity between two vectors.
 */
const cosineSimilarity = (vec1, vec2) => {
  const len = Math.min(vec1.length, vec2.length);
  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < len; i++) {
    const v1 = vec1[i];
    const v2 = vec2[i];
    dot += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
};

/**
 * Build the in-memory embedding index from the loaded dataset.
 * This is our "RAG store" for semantic retrieval.
 */
async function buildEmbeddingIndex() {
  if (!healthcareDataset.length) {
    console.warn('⚠️ Cannot build embeddings index: dataset is empty');
    return;
  }

  try {
    console.log('🧱 Building semantic embedding index for RAG...');
    const index = [];

    for (const item of healthcareDataset) {
      // Build a rich text representation for each entry
      const textForEmbedding = [
        item.condition || '',
        item.category || '',
        item.query || '',
        (item.response || '').slice(0, 300)
      ]
        .join(' ')
        .toLowerCase();

      const vector = await embedText(textForEmbedding);
      index.push({ vector, item });
    }

    embeddingIndex = index;
    areEmbeddingsReady = true;
    console.log(`✅ RAG embedding index built for ${index.length} entries`);
  } catch (err) {
    console.error('❌ Error while building embedding index:', err);
    areEmbeddingsReady = false;
  }
}

// ==============================
// 📌 Dataset Loader (existing CSV)
// ==============================
const loadDataset = () => {
  return new Promise((resolve, reject) => {
    if (isDatasetLoaded) {
      resolve(healthcareDataset);
      return;
    }

    const datasetPath = path.join(__dirname, '../data/healthcare_dataset.csv');
    const dataset = [];

    console.log('📂 Loading dataset from:', datasetPath);

    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on('data', (row) => {
        dataset.push({
          category: row.Category,
          condition: row.Condition,
          query: row.UserQuery.toLowerCase().trim(),
          response: row.BotResponse
        });
      })
      .on('end', () => {
        healthcareDataset = dataset;

        // Build TF-IDF index
        dataset.forEach(item => {
          tfidf.addDocument(item.query);
        });

        isDatasetLoaded = true;
        console.log(`✅ Loaded ${dataset.length} healthcare entries`);

        // Kick off embedding index build (async, non-blocking)
        buildEmbeddingIndex().catch(err => {
          console.error('❌ Failed to build embedding index:', err);
        });

        resolve(dataset);
      })
      .on('error', (err) => {
        console.error('❌ Error loading dataset:', err);
        reject(err);
      });
  });
};

// ==============================
// 📌 Text Preprocessing (for TF-IDF)
// ==============================
const preprocessText = (text) => {
  let processed = text.toLowerCase();
  processed = processed.replace(/[^\w\s]/g, ' ');
  const tokens = tokenizer.tokenize(processed);
  const stemmedTokens = tokens.map(token => stemmer.stem(token));
  return stemmedTokens.join(' ');
};

// ==============================
// 📌 TF-IDF Match (existing logic)
// ==============================
const findBestTfidfMatch = (userQuery) => {
  if (!isDatasetLoaded || healthcareDataset.length === 0) {
    return null;
  }

  const processedQuery = preprocessText(userQuery);

  // Add user query as temporary document
  tfidf.addDocument(processedQuery);
  const queryIndex = tfidf.documents.length - 1;

  let bestMatch = null;
  let highestSimilarity = 0;
  const threshold = 0.3; // Minimum similarity threshold

  healthcareDataset.forEach((item, index) => {
    const queryVector = [];
    const docVector = [];

    tfidf.listTerms(queryIndex).forEach(term => {
      queryVector.push(term.tfidf);
    });

    tfidf.listTerms(index).forEach(term => {
      docVector.push(term.tfidf);
    });

    const maxLength = Math.max(queryVector.length, docVector.length);
    while (queryVector.length < maxLength) queryVector.push(0);
    while (docVector.length < maxLength) docVector.push(0);

    const similarity = cosineSimilarity(queryVector, docVector);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = item;
    }
  });

  // Remove temporary document
  tfidf.documents.pop();

  if (highestSimilarity >= threshold) {
    return {
      ...bestMatch,
      confidence: highestSimilarity
    };
  }

  return null;
};

// ==============================
// 📌 Semantic RAG Match (Embeddings-based)
// ==============================
async function findBestSemanticMatch(userQuery, topK = 3) {
  if (!areEmbeddingsReady || !embeddingIndex.length) {
    return null;
  }

  const queryVector = await embedText(userQuery.toLowerCase());
  const scored = embeddingIndex.map(({ vector, item }) => ({
    item,
    score: cosineSimilarity(queryVector, vector)
  }));

  scored.sort((a, b) => b.score - a.score);

  const filtered = scored.filter(s => s.score >= 0.5); // semantic threshold
  if (!filtered.length) return null;

  const topMatches = filtered.slice(0, topK);
  const best = topMatches[0];

  // Combine top matches as "context" if you ever plug in a generative LLM
  const context = topMatches
    .map((m, idx) => {
      return `Match ${idx + 1}:
Condition: ${m.item.condition}
Category: ${m.item.category}
QA Pair: ${m.item.response}`;
    })
    .join('\n\n');

  return {
    bestItem: best.item,
    bestScore: best.score,
    topMatches,
    context
  };
}

// ==============================
// 📌 Controller: sendMessage
// ==============================

// @desc    Chat with health assistant
// @route   POST /api/chatbot/message
// @access  Private (Patient)
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    // Ensure dataset is loaded
    if (!isDatasetLoaded) {
      await loadDataset();
    }

    const lowerMessage = message.toLowerCase().trim();
    const greetings = [
      'hi',
      'hello',
      'hey',
      'good morning',
      'good evening',
      'good afternoon',
      'howdy',
      'greetings'
    ];

    // Simple greeting handler
    if (greetings.includes(lowerMessage)) {
      return res.status(200).json({
        success: true,
        data: {
          message:
            "Welcome to DocNearYou chatbot! 👋\n\nI'm here to help you with general health information based on trusted content in our system. You can ask me about common symptoms, conditions, preventive care, and when you should consider seeing a doctor.\n\n⚠️ *Note:* I do not provide medical diagnosis. For serious concerns, always consult a doctor.",
          timestamp: new Date(),
          confidence: 1.0,
          method: 'rule-based',
          fallback: false,
          model: 'rule-based'
        }
      });
    }

    // ==============================
    // 1️⃣ Try Semantic RAG (Embeddings)
    // ==============================
    let ragMatch = null;
    if (areEmbeddingsReady) {
      try {
        ragMatch = await findBestSemanticMatch(message);
      } catch (err) {
        console.error('❌ Error in semantic RAG match:', err);
      }
    }

    if (ragMatch && ragMatch.bestItem) {
      const { bestItem, bestScore } = ragMatch;
      console.log(
        `✅ RAG semantic match: ${bestItem.condition} (Score: ${(bestScore * 100).toFixed(2)}%)`
      );

      return res.status(200).json({
        success: true,
        data: {
          message: bestItem.response,
          category: bestItem.category,
          condition: bestItem.condition,
          confidence: bestScore,
          timestamp: new Date(),
          method: 'semantic-rag',
          fallback: false,
          model: 'semantic-rag'
        }
      });
    }

    // // ==============================
    // // 2️⃣ Fallback to TF-IDF (existing logic)
    // // ==============================
    // const tfidfMatch = findBestTfidfMatch(message);

    // if (tfidfMatch) {
    //   console.log(
    //     `✅ TF-IDF match: ${tfidfMatch.condition} (Confidence: ${(tfidfMatch.confidence * 100).toFixed(2)}%)`
    //   );

    //   return res.status(200).json({
    //     success: true,
    //     data: {
    //       message: tfidfMatch.response,
    //       category: tfidfMatch.category,
    //       condition: tfidfMatch.condition,
    //       confidence: tfidfMatch.confidence,
    //       timestamp: new Date(),
    //       method: 'tfidf',
    //       fallback: false,
    //       model: 'tfidf'
    //     }
    //   });
    // }

    // ==============================
    // 3️⃣ Final fallback message
    // ==============================
    console.log('⚠️  No match found for query');

    const fallbackMessage = `I understand you're asking about "${message}", but I don't have specific information on that topic in my current knowledge base.

**What I can help you with:**
• Common health conditions and symptoms  
• General wellness and prevention tips  
• When you should consider seeing a doctor  
• Basic, non-emergency first-aid information  

⚠️ **Important:** I cannot diagnose medical conditions.  
For serious or persistent symptoms, please book an appointment with a doctor through DocNearYou or visit your nearest hospital.  
In case of emergency, call your local emergency number (e.g., 108/911).`;

    return res.status(200).json({
      success: true,
      data: {
        message: fallbackMessage,
        timestamp: new Date(),
        confidence: 0,
        method: 'fallback',
        fallback: true,
        model: 'fallback'
      }
    });
  } catch (error) {
    console.error('❌ Chatbot error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error.message
    });
  }
};

// ==============================
// 📌 getCommonQuestions (unchanged except content)
// ==============================

// @desc    Get common health questions
// @route   GET /api/chatbot/common-questions
// @access  Public
exports.getCommonQuestions = async (req, res) => {
  try {
    const commonQuestions = [
      {
        id: 1,
        question: "Can you tell me about fever?",
        category: "General & Everyday Illnesses",
        icon: "🌡️"
      },
      {
        id: 2,
        question: "Can you tell me about headache?",
        category: "General & Everyday Illnesses",
        icon: "🤕"
      },
      {
        id: 3,
        question: "Can you tell me about covid-19?",
        category: "Infectious Diseases",
        icon: "😷"
      },
      {
        id: 5,
        question: "Can you tell me about common cold?",
        category: "General & Everyday Illnesses",
        icon: "🤧"
      },
      {
        id: 7,
        question: "Can you tell me about asthma?",
        category: "Chronic Diseases",
        icon: "🫁"
      },
      {
        id: 8,
        question: "Can you tell me about anxiety?",
        category: "Mental Health",
        icon: "🧘"
      },
      {
        id: 9,
        question: "Can you tell me about acne?",
        category: "Skin Conditions",
        icon: "😊"
      },
      {
        id: 10,
        question: "Can you tell me about migraine?",
        category: "Chronic Diseases",
        icon: "🤯"
      }
    ];

    return res.status(200).json({
      success: true,
      count: commonQuestions.length,
      data: commonQuestions
    });
  } catch (error) {
    console.error('Error getting common questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching common questions'
    });
  }
};

// ==============================
// 📌 getStats (unchanged)
// ==============================

// @desc    Get chatbot statistics
// @route   GET /api/chatbot/stats
// @access  Public
exports.getStats = async (req, res) => {
  try {
    if (!isDatasetLoaded) {
      await loadDataset();
    }

    const categories = [...new Set(healthcareDataset.map(item => item.category))];
    const conditions = [...new Set(healthcareDataset.map(item => item.condition))];

    return res.status(200).json({
      success: true,
      data: {
        totalEntries: healthcareDataset.length,
        categories: categories.length,
        conditions: conditions.length,
        categoryList: categories,
        isLoaded: isDatasetLoaded,
        embeddingsReady: areEmbeddingsReady
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

// Initialize dataset on server start
loadDataset().catch(err => {
  console.error('❌ Failed to load dataset:', err);
  console.error('⚠️  Chatbot will not work until dataset is loaded');
});