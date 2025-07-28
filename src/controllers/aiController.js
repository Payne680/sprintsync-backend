const logger = require("../utils/logger");
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const gemini = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

const suggestTaskDescription = async (req, res, _next) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title) {
      return res.status(400).json({
        error: "Title is required.",
      });
    }

    // Check if any AI API key is configured
    if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
      logger.warn(
        "No AI API keys configured, falling back to mock suggestions",
        { userId, title }
      );
      const suggestion = generateMockSuggestion(title);
      return res.json({
        title,
        suggestion: {
          description: suggestion,
          confidence: 0.85,
          source: "mock-fallback",
        },
      });
    }

    // Try AI providers in order of preference
    const suggestion = await generateAISuggestion(title);

    logger.info("AI suggestion generated", {
      userId,
      title,
      source: suggestion.source,
    });

    res.json({
      title,
      suggestion: {
        description: suggestion.description,
        confidence: suggestion.confidence,
        source: suggestion.source,
      },
    });
  } catch (error) {
    const { title } = req.body;
    const userId = req.user.id;

    logger.error("Error generating AI suggestion", {
      userId,
      title,
      error: error.message,
    });

    // Fallback to mock suggestion on API error
    const fallbackSuggestion = generateMockSuggestion(title);
    res.json({
      title,
      suggestion: {
        description: fallbackSuggestion,
        confidence: 0.7,
        source: "mock-fallback",
      },
    });
  }
};

// Generate AI suggestion using multiple providers with fallback
const generateAISuggestion = async (title) => {
  const prompt = `You are a helpful task management assistant. Given a task title, provide a detailed, actionable description that breaks down the task into clear steps. Be practical and specific.

Task Title: "${title}"

Please provide:
1. A brief overview of what this task involves
2. Specific steps to complete it
3. Any considerations or prerequisites
4. Estimated complexity level

Keep the response concise but comprehensive, around 2-3 sentences.`;

  // Try providers in order of preference
  const providers = [
    { name: "gemini", available: !!gemini },
    { name: "openai", available: !!openai },
  ];

  for (const provider of providers) {
    if (!provider.available) continue;

    try {
      logger.info(`Attempting AI generation with ${provider.name}`, {
        provider: provider.name,
      });

      if (provider.name === "gemini") {
        return await generateGeminiSuggestion(prompt, title);
      } else if (provider.name === "openai") {
        return await generateOpenAISuggestion(prompt, title);
      }
    } catch (error) {
      logger.warn(`AI provider ${provider.name} failed, trying next`, {
        provider: provider.name,
        error: error.message,
      });
      continue;
    }
  }

  throw new Error("All AI providers failed");
};

// Generate suggestion using Google Gemini
const generateGeminiSuggestion = async (prompt, title) => {
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const aiResponse = response.text().trim();

  if (!aiResponse) {
    throw new Error("Empty response from Gemini");
  }

  const confidence = calculateConfidence(aiResponse, title);

  return {
    description: aiResponse,
    confidence,
    source: "gemini",
  };
};

// Generate suggestion using OpenAI GPT
const generateOpenAISuggestion = async (prompt, title) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful task management assistant that provides clear, actionable task descriptions and breakdown steps.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  const aiResponse = completion.choices[0]?.message?.content?.trim();

  if (!aiResponse) {
    throw new Error("Empty response from OpenAI");
  }

  const confidence = calculateConfidence(aiResponse, title);

  return {
    description: aiResponse,
    confidence,
    source: "openai",
  };
};

// Calculate confidence score based on response quality
const calculateConfidence = (response, title) => {
  let score = 0.5; // Base score

  // Length check - good responses are typically substantial
  if (response.length > 100) score += 0.2;
  if (response.length > 200) score += 0.1;

  // Check for key task management terms
  const taskTerms = [
    "step",
    "consider",
    "implement",
    "review",
    "test",
    "plan",
    "analyze",
  ];
  const foundTerms = taskTerms.filter((term) =>
    response.toLowerCase().includes(term)
  ).length;
  score += (foundTerms / taskTerms.length) * 0.2;

  // Check if response mentions the original title context
  if (response.toLowerCase().includes(title.toLowerCase().split(" ")[0])) {
    score += 0.1;
  }

  return Math.min(0.95, Math.max(0.6, score)); // Clamp between 0.6 and 0.95
};

// Mock AI suggestion generator (fallback)
// Used when OpenAI API is unavailable or not configured
const generateMockSuggestion = (title) => {
  const suggestions = {
    // Common task patterns
    setup:
      "This task involves setting up and configuring necessary components or systems. Consider breaking this down into smaller steps: research requirements, gather resources, implement configuration, and test the setup.",
    fix: "This task is about identifying and resolving an issue. Steps might include: reproduce the problem, analyze root cause, implement solution, and verify the fix works as expected.",
    implement:
      "This task involves building or creating new functionality. Consider: design the solution, write the code/content, test thoroughly, and document the implementation.",
    review:
      "This task involves examining and evaluating existing work. Include: gather materials to review, analyze thoroughly, provide constructive feedback, and document findings.",
    update:
      "This task is about modifying or improving existing elements. Steps: assess current state, identify what needs changing, implement updates, and validate improvements.",
    test: "This task involves verifying functionality and quality. Include: create test cases, execute tests systematically, document results, and report any issues found.",
  };

  // Find matching pattern
  const titleLower = title.toLowerCase();
  for (const [pattern, suggestion] of Object.entries(suggestions)) {
    if (titleLower.includes(pattern)) {
      return suggestion;
    }
  }

  // Default suggestion
  return `This task is about: ${title}. Consider breaking this down into specific, actionable steps. Define clear success criteria and estimated time requirements. Identify any dependencies or resources needed to complete this task effectively.`;
};

module.exports = {
  suggestTaskDescription,
  generateMockSuggestion,
};
