import { GoogleGenerativeAI } from "@google/generative-ai";



/**
 * Deterministic mapping for triage actions based on severity.
 * This is the ultimate source of truth and fallback.
 */
const DETERMINISTIC_MAP = {
    CRITICAL: { action: "ESCALATE", rationale: "Immediate risk detected. Protocol requires instant escalation to senior responders." },
    HIGH: { action: "DISPATCH", rationale: "Significant disruption confirmed. Deploying field units for investigation." },
    MEDIUM: { action: "MONITOR", rationale: "Anomaly detected. Status tracking increased via automated protocols." },
    LOW: { action: "DEFER", rationale: "Minor deviation. Logging for next scheduled maintenance review." }
};

/**
 * Executes a constrained AI triage request with lazy initialization.
 */
export async function getAITriage(payload) {
    const startTime = Date.now();
    let modelUsed = "gemini-1.5-flash";

    // Lazy check for API key to handle serverless lifecycle better
    const currentApiKey = process.env.GEMINI_API_KEY;

    if (!currentApiKey) {
        console.error("[AI-DEBUG] FATAL: GEMINI_API_KEY is null at runtime.");
        return {
            ...DETERMINISTIC_MAP[payload.computedSeverity] || DETERMINISTIC_MAP.MEDIUM,
            aiFallback: true,
            modelUsed: "deterministic-no-key",
            latency: 0,
            generatedAt: new Date().toISOString()
        };
    }

    const genAI = new GoogleGenerativeAI(currentApiKey);

    try {
        const model = genAI.getGenerativeModel({
            model: modelUsed,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            Context: You are a constrained intelligence layer for a campus operations system.
            Rules:
            - Explain the triage decision based on the provided metrics.
            - Recommendations MUST match the Severity context.
            - Severity CRITICAL/HIGH = ESCALATE or DISPATCH.
            - Severity MEDIUM/LOW = MONITOR or DEFER.
            - Recommended actions: ESCALATE, MONITOR, DISPATCH, DEFER.
            - Rationale must be ≤ 3 lines.
            - Output format: STRICT JSON.

            Input Metrics:
            - Issue Title: ${payload.title}
            - Description: ${payload.description}
            - Computed Severity: ${payload.computedSeverity}
            - Campus Health Score: ${payload.healthScore}
            - Open Issues Count: ${payload.openIssuesCount}
            - Avg Resolution Time: ${payload.avgResolutionTimeHours} hours

            Required Schema:
            {
                "recommendedAction": "ESCALATE" | "MONITOR" | "DISPATCH" | "DEFER",
                "rationale": "string",
                "confidence": number
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const data = JSON.parse(text);

        // Validation - Ensure AI stays within constraints
        const validActions = ["ESCALATE", "MONITOR", "DISPATCH", "DEFER"];
        if (!validActions.includes(data.recommendedAction)) {
            throw new Error(`Invalid AI action: ${data.recommendedAction}`);
        }

        return {
            recommendedAction: data.recommendedAction,
            rationale: data.rationale,
            confidence: data.confidence || 0.9,
            aiFallback: false,
            modelUsed,
            latency: Date.now() - startTime,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error("[AI] Error or Hallucination detected, falling back:", error);
        return {
            recommendedAction: DETERMINISTIC_MAP[payload.computedSeverity]?.action || "MONITOR",
            rationale: DETERMINISTIC_MAP[payload.computedSeverity]?.rationale || "System fallback due to processing delay.",
            confidence: 1.0,
            aiFallback: true,
            modelUsed: "deterministic-mapping",
            latency: Date.now() - startTime,
            generatedAt: new Date().toISOString()
        };
    }
}
