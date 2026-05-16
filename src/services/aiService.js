const BACKEND_URL = "http://localhost:5000";

// ✅ Rate limiter SIMPLE et FIABLE
let lastRequestTime = 0;
const MIN_DELAY_BETWEEN_REQUESTS = 2500; // 2.5 secondes entre chaque requête

const waitForRateLimit = async () => {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_BETWEEN_REQUESTS) {
    const waitTime = MIN_DELAY_BETWEEN_REQUESTS - elapsed;
    console.log(`⏳ Attente ${(waitTime / 1000).toFixed(1)}s...`);
    await new Promise((r) => setTimeout(r, waitTime));
  }
  lastRequestTime = Date.now();
};

/**
 * 📞 Appel à l'IA avec retry
 */
const callAI = async (
  messages,
  jsonMode = true,
  maxTokens = 4000,
  retries = 3,
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await waitForRateLimit();

      console.log(`📤 Appel IA (essai ${attempt}/${retries})...`);

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // ⚡ Modèle rapide avec plus de tokens
          messages,
          ...(jsonMode && { response_format: { type: "json_object" } }),
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
      });

      const responseText = await response.text();

      // ✅ Si rate limit, attendre intelligemment
      if (response.status === 429) {
        let waitTime = 30000; // 30s par défaut
        try {
          const errorData = JSON.parse(responseText);
          const msg = errorData?.error?.message || "";
          // Extraire le délai du message ex: "try again in 12.5s"
          const match = msg.match(/(\d+(?:\.\d+)?)s/);
          if (match) {
            waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 2000;
          }
        } catch (e) {}
        // Limiter l'attente max à 60s
        waitTime = Math.min(waitTime, 60000);
        console.log(
          `⚠️ Rate limit. Attente ${(waitTime / 1000).toFixed(0)}s (essai ${attempt}/${retries})`,
        );
        if (attempt === retries) {
          throw new Error(
            `Rate limit Groq atteint. Attendez 1 minute et réessayez.`,
          );
        }
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }

      // ✅ Parser la réponse
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ Réponse non-JSON:", responseText.substring(0, 200));
        throw new Error(
          `Réponse invalide du serveur (status ${response.status})`,
        );
      }

      if (!response.ok) {
        const errorMsg = data?.error?.message || JSON.stringify(data);
        throw new Error(`API Error (${response.status}): ${errorMsg}`);
      }

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Réponse vide de l'IA");
      }

      console.log("✅ Réponse OK");
      return content;
    } catch (error) {
      console.error(`❌ Essai ${attempt}:`, error.message);
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
};

/**
 * ✂️ Découpe le document
 */
const chunkDocument = (content, chunkSize = 8000) => {
  const chunks = [];
  let start = 0;
  while (start < content.length) {
    let end = start + chunkSize;
    if (end < content.length) {
      const lastNewline = content.lastIndexOf("\n", end);
      const lastDot = content.lastIndexOf(".", end);
      const cutPoint = Math.max(lastNewline, lastDot);
      if (cutPoint > start + chunkSize / 2) {
        end = cutPoint + 1;
      }
    }
    chunks.push(content.substring(start, end));
    start = end;
  }
  return chunks;
};

/**
 * 🧠 Analyse en UNE SEULE requête
 */
const analyzeDocument = async (content) => {
  console.log("📊 Analyse globale du document...");
  // Tronquer si trop long
  const truncated = content.substring(0, 12000);
  const prompt = `Analyze this document and extract the main topics.

DOCUMENT:
${truncated}

Respond in JSON:
{
  "mainTopic": "Main topic of the document",
  "subTopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5"],
  "keyTerms": ["term 1", "term 2", "term 3"],
  "summary": "Global summary of the document in 200 words"
}`;

  try {
    const result = await callAI(
      [
        {
          role: "system",
          content: "Tu analyses des documents et réponds en JSON valide.",
        },
        { role: "user", content: prompt },
      ],
      true,
      1500,
    );
    return JSON.parse(result);
  } catch (error) {
    console.error("❌ Erreur analyse:", error);
    return {
      mainTopic: "Document analysé",
      subTopics: [
        "Introduction",
        "Concepts clés",
        "Applications",
        "Cas pratiques",
        "Conclusion",
      ],
      keyTerms: [],
      summary: truncated.substring(0, 500),
    };
  }
};

/**
 * 📚 Génère le PLAN du cours (1 seule requête)
 */
/**
 * 🔍 Détecte automatiquement les sections/titres du document
 */
const detectDocumentSections = (content) => {
  const lines = content.split("\n");

  const sections = lines
    .map((line) => line.trim())
    .filter((line) => {
      return (
        line.length > 5 &&
        line.length < 120 &&
        (/^[0-9]+\./.test(line) || // 1. Introduction
          /^[0-9]+\s+-/.test(line) || // 1 - Intro
          /^chapter/i.test(line) ||
          /^chapitre/i.test(line) ||
          /^section/i.test(line) ||
          /^#+\s/.test(line) || // Markdown #
          /^[A-Z\s]{5,}$/.test(line)) // TITRE MAJUSCULE
      );
    });

  return [...new Set(sections)];
};

/**
 * 📚 Génère le PLAN du cours
 */
export const generateCoursePlan = async ({
  content,
  duration,
  difficulty,
  language = "English",
  specification,
}) => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 GÉNÉRATION PLAN COURS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const specText = specification?.trim();

    // ✅ Analyse globale
    const analysis = await analyzeDocument(content);

    console.log("✅ Analyse terminée");

    // ✅ Découpage document
    const chunks = chunkDocument(content, 12000);

    console.log(`📄 ${chunks.length} chunks créés`);

    // ✅ Détection sections réelles
    const detectedSections = detectDocumentSections(content);

    console.log("📚 Sections détectées:", detectedSections);

    // ✅ Nombre dynamique de chapitres
    const estimatedChapters = Math.max(detectedSections.length, 1);

    console.log("📘 Nombre chapitres estimé:", estimatedChapters);

    // ✅ Prompt amélioré
    const prompt = `
You are a senior instructional design expert.

Analyze this document and create a structured course.

${specText ? `⚠️ User specifications to consider:\n${specText}\n\n` : ""}

━━━━━━━━━━━━━━━
📌 DOCUMENT ANALYSIS
━━━━━━━━━━━━━━━

MAIN TOPIC:
${analysis.mainTopic}

SUBTOPICS:
${analysis.subTopics.join(", ")}

KEY TERMS:
${analysis.keyTerms.join(", ")}

SUMMARY:
${analysis.summary}

━━━━━━━━━━━━━━━
📚 DETECTED SECTIONS
━━━━━━━━━━━━━━━

${detectedSections.join("\n")}

━━━━━━━━━━━━━━━
⚙ PARAMETERS
━━━━━━━━━━━━━━━

- Language: ${language}
- Difficulty: ${difficulty}
- Duration: ${duration} minutes

━━━━━━━━━━━━━━━
🚨 IMPORTANT INSTRUCTIONS
━━━━━━━━━━━━━━━

1. Keep ORIGINAL TITLES if present
2. Respect the real structure of the document
3. Do NOT merge chapters unnecessarily
4. Create as many chapters as needed
5. Chapters must follow a logical progression
6. Each chapter must include:
   - a title
   - a summary
   - key concepts
   - estimated duration
   - topics

━━━━━━━━━━━━━━━
📤 JSON FORMAT
━━━━━━━━━━━━━━━

{
  "title": "Course title",
  "description": "Course description",
  "totalChapters": ${estimatedChapters},
  "chapters": [
    {
      "id": 1,
      "title": "Real chapter title",
      "summary": "Detailed summary",
      "duration": 15,
      "topics": [
        "topic 1",
        "topic 2"
      ],
      "concepts": [
        "concept 1",
        "concept 2"
      ]
    }
  ]
}

IMPORTANT:
- Respond ONLY with valid JSON
- No text outside JSON
`;

    // ✅ Appel IA
    const result = await callAI(
      [
        {
          role: "system",
          content:
            "Tu génères des plans de cours pédagogiques très structurés en JSON valide.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      true,
      3000,
    );

    // ✅ Parsing sécurisé
    let plan;

    try {
      plan = JSON.parse(result);
    } catch (e) {
      console.error("❌ JSON invalide:", result);

      throw new Error("Réponse JSON invalide");
    }

    // ✅ Validation
    if (!plan.chapters || !Array.isArray(plan.chapters)) {
      throw new Error("Structure du plan invalide");
    }

    // ✅ Enrichissement
    plan.chunks = chunks;

    plan.analysis = analysis;

    plan.metadata = {
      difficulty,
      language,
      totalContentLength: content.length,
      detectedSections,
    };

    // ✅ Initialisation chapitres
    plan.chapters = plan.chapters.map((chapter, index) => ({
      ...chapter,
      id: chapter.id || index + 1,
      content: null,
      keyPoints: null,
      questions: null,
      isGenerated: false,
    }));

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ PLAN GÉNÉRÉ (${plan.chapters.length} chapitres)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return plan;
  } catch (error) {
    console.error("❌ ERREUR generateCoursePlan:", error);

    throw new Error(error?.message || "Erreur génération plan");
  }
};

/**
 * 📖 Génère UN chapitre
 */
export const generateChapterContent = async (course, chapterIndex) => {
  const chapter = course.chapters[chapterIndex];
  if (chapter.isGenerated) {
    console.log("📦 Chapitre déjà généré");
    return chapter;
  }
  console.log(`📝 Génération chapitre ${chapterIndex + 1}: ${chapter.title}`);
  // Trouver les chunks pertinents pour ce chapitre
  const chapterTopics = [...(chapter.topics || []), ...(chapter.concepts || [])]
    .join(" ")
    .toLowerCase();
  // Sélectionner les 2 chunks les plus pertinents
  const relevantChunks = course.chunks
    .map((chunk, idx) => {
      const chunkLower = chunk.toLowerCase();
      let score = 0;
      chapterTopics.split(" ").forEach((word) => {
        if (word.length > 3 && chunkLower.includes(word)) score++;
      });
      return { chunk, idx, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((c) => c.chunk);
  // Si aucun chunk trouvé, prendre les 2 premiers
  const sourceContent = (
    relevantChunks.length > 0 ? relevantChunks : course.chunks.slice(0, 2)
  )
    .join("\n\n")
    .substring(0, 6000);
  const { difficulty, language } = course.metadata;

  const prompt = `Generate a DETAILED COURSE CHAPTER in ${language}.

CHAPTER:
- Title: ${chapter.title}
- Summary: ${chapter.summary}
- Concepts to cover: ${(chapter.concepts || []).join(", ")}

SOURCE CONTENT FROM DOCUMENT:
${sourceContent}

INSTRUCTIONS:

1. Write 400–600 words minimum
2. Use multiple paragraphs separated ONLY by \\n\\n
3. Base EVERYTHING strictly on the source content
4. DO NOT invent information outside the source
5. Generate exactly 3 questions
6. Question types MUST be one of:
   - "mcq"
   - "coding"
   - "true_false"
   - "short_answer"

7. Types must be chosen based on content relevance
8. DO NOT include explanations outside JSON
9. DO NOT write headings like "Key points", "Examples", etc.

STRICT OUTPUT RULES:

- Return ONLY valid JSON
- No markdown
- No text before or after JSON
- No explanations
- No duplicated sections
- No headings
- No bullet lists outside JSON

OUTPUT FORMAT:

{
  "content": "Paragraph 1.\\n\\nParagraph 2.\\n\\nParagraph 3.\\n\\nConclusion.",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4"
  ],
  "examples": [
    "Example 1",
    "Example 2"
  ],
  "questions": [
    {
      "id": "q1",
      "type": "mcq | coding | true_false | short_answer",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "code": null,
      "explanation": "Explanation inside JSON only"
    }
  ]
}`;

  try {
    const result = await callAI(
      [
        {
          role: "system",
          content: "Tu génères du contenu de cours détaillé en JSON valide.",
        },
        { role: "user", content: prompt },
      ],
      true,
      4000,
    );
    let chapterContent;
    try {
      chapterContent = JSON.parse(result);
    } catch (e) {
      console.error("JSON invalide, fallback");
      chapterContent = {
        content: `# ${chapter.title}\n\n${chapter.summary}\n\n${sourceContent.substring(0, 1500)}`,
        keyPoints: chapter.concepts || ["Concept à étudier"],
        examples: [],
        questions: [],
      };
    }
    return {
      ...chapter,
      content: chapterContent.content || chapter.summary,
      keyPoints: chapterContent.keyPoints || [],
      examples: chapterContent.examples || [],
      questions: chapterContent.questions || [],
      isGenerated: true,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erreur génération chapitre:", error);
    throw new Error(error?.message || "Erreur génération chapitre");
  }
};

/**
 * 🚀 Fonction principale
 */
export const generateCourseFromAI = async (params) => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 DÉBUT GÉNÉRATION COURS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  // 1. Générer le plan (1 requête analyse + 1 requête plan = 2 requêtes)
  const plan = await generateCoursePlan(params);
  // 2. Générer le premier chapitre (1 requête)
  console.log("📝 Génération du premier chapitre...");
  try {
    const firstChapter = await generateChapterContent(plan, 0);
    plan.chapters[0] = firstChapter;
    console.log("✅ Premier chapitre généré");
  } catch (error) {
    console.warn(
      "⚠️ Premier chapitre échoué, sera généré à la demande:",
      error.message,
    );
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ COURS GÉNÉRÉ AVEC SUCCÈS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  return plan;
};

/**
 * Évaluation de code
 */
export const evaluateCode = async (userCode, question) => {
  const prompt = `Evaluate this code strictly for Guidewire Gosu.
Do NOT mark it correct if the output does not match exactly.
Provide detailed feedback specific to Gosu and Guidewire best practices.

QUESTION: ${question.question}
EXPECTED OUTPUT: ${question.expectedOutput}

CODE:
${userCode}

Consider the following when evaluating:
- Type safety in Gosu
- Correct usage of entities and fields in Guidewire
- Proper use of Gosu operators and syntax
- Common runtime errors in Guidewire rules

Return JSON only:
{
  "correct": true/false,
  "score": 0-100,
  "message": "Feedback explaining what is correct or wrong, including Gosu-specific advice",
  "errors": [],
  "suggestions": [],
  "correctedCode": null
}`;

  try {
    const result = await callAI(
      [
        { role: "system", content: "Tu évalues du code en JSON." },
        { role: "user", content: prompt },
      ],
      true,
      1500,
    );
    return JSON.parse(result);
  } catch (error) {
    return {
      correct: false,
      score: 0,
      message: `Erreur: ${error?.message || error}`,
      errors: [],
      suggestions: [],
      correctedCode: null,
    };
  }
};

export const getHint = async (question, userCode) => {
  try {
    const result = await callAI(
      [
        {
          role: "user",
          content: `Indice subtil pour: ${question.question}\nCode: ${userCode || "vide"}\nJSON: {"hint": "indice court"}`,
        },
      ],
      true,
      300,
    );
    return JSON.parse(result).hint;
  } catch (error) {
    return "Réfléchissez étape par étape.";
  }
};

export async function generateAIResponse(question, course) {
  const prompt = `
Réponds de manière simple à la question suivante.
Ne renvoie pas JSON, pas d'exemples séparés, juste une réponse textuelle.
Question: ${question}
  `;

  const response = await callAI(
    [{ role: "user", content: prompt }],
    true,
    1500,
  );

  return response.text || response; // retourne uniquement le texte
}
