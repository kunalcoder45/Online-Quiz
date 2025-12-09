"use client";

import { useState } from "react";
import { Sparkles, Plus, Edit2, Trash2, Play, Loader } from "lucide-react";

// ========================
//     TYPES
// ========================
interface Question {
  question: string;
  options: string[];
  correct: number;
  time: number;
}

interface GeminiPart {
  text?: string;
  json?: unknown;
  functionCall?: { args: unknown };
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: GeminiPart[];
    };
  }[];
}

interface Props {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onStartQuiz: () => void;
}

export default function AdminQuestionCreator({
  questions,
  setQuestions,
  onStartQuiz,
}: Props) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // ================================
  //       🔥 GEMINI AI GENERATE
  // ================================
  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      alert("Please enter a topic!");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
          process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate 5 multiple choice quiz questions about: ${aiPrompt}.
Return ONLY a clean JSON array (no markdown).
Format EXACTLY like:

[
  { 
    "question": "What is ...?",
    "options": ["A","B","C","D"],
    "correct": 1,
    "time": 30
  }
]

Rules:
• correct must be index 0–3
• options must have exactly 4 values
• valid JSON only`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data: GeminiResponse = await response.json();

      // extract Gemini Response
      const raw = data?.candidates?.[0]?.content?.parts?.[0];

      let parsed: unknown = null;

      // -------- TEXT PARSE --------
      if (raw?.text) {
        try {
          parsed = JSON.parse(raw.text.replace(/```json|```/g, "").trim());
        } catch (_) {
          alert("AI returned invalid JSON.");
          setIsGenerating(false);
          return;
        }
      }

      // -------- JSON KEY --------
      else if (raw?.json) {
        parsed = raw.json;
      }

      // -------- FUNCTION CALL --------
      else if (raw?.functionCall?.args) {
        parsed = raw.functionCall.args;
      }

      else {
        alert("AI gave unexpected response!");
        setIsGenerating(false);
        return;
      }

      if (!Array.isArray(parsed)) {
        alert("AI did not return array.");
        setIsGenerating(false);
        return;
      }

      // convert result into correct type
      const finalParsed: Question[] = (parsed as Question[]).map((q) => ({
        question: q.question,
        options: q.options,
        correct: q.correct ?? 0,
        time: q.time ?? 30,
      }));

      setQuestions((prev) => [...prev, ...finalParsed]);
      setAiPrompt("");

      alert("Questions generated successfully!");
    } catch (_) {
      alert("Failed to generate questions.");
    }

    setIsGenerating(false);
  };

  // ================================
  //     Add Manual Question
  // ================================
  const addManualQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "Enter your question here?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct: 0,
        time: 30,
      },
    ]);
  };

  // ================================
  //     Update Question
  // ================================
  const updateQuestion = (
    index: number,
    field: keyof Question,
    value: string | number
  ) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // ================================
  //     Update Specific Option
  // ================================
  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const question = updated[qIndex];

      const newOptions = [...question.options];
      newOptions[optIndex] = value;

      updated[qIndex] = {
        ...question,
        options: newOptions,
      };

      return updated;
    });
  };

  // ================================
  //     Delete Question
  // ================================
  const deleteQuestion = (index: number) => {
    if (confirm("Delete this question?")) {
      setQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ================================
  //     UI
  // ================================
  return (
    <div className="space-y-6">
      {/* AI Box */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" /> Generate with AI
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter topic (e.g., Java, Science, GK)"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateWithAI()}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 outline-none"
            disabled={isGenerating}
          />

          <button
            onClick={generateWithAI}
            disabled={isGenerating}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition disabled:opacity-50"
          >
            {isGenerating ? <Loader className="w-5 h-5 animate-spin" /> : "Generate"}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Questions ({questions.length})</h2>

        <button
          onClick={addManualQuestion}
          className="bg-gray-800 text-white px-4 py-2 rounded-xl flex gap-2 items-center hover:bg-gray-700"
        >
          <Plus className="w-4 h-4" /> Add Manual Question
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between mb-4">
              <span className="text-purple-600 font-semibold">Q{qIndex + 1}</span>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setEditingIndex(editingIndex === qIndex ? null : qIndex)
                  }
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteQuestion(qIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {editingIndex === qIndex ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) =>
                    updateQuestion(qIndex, "question", e.target.value)
                  }
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />

                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="relative">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIndex, optIndex, e.target.value)
                        }
                        className={`w-full px-4 py-2 border-2 rounded-lg ${
                          q.correct === optIndex
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300"
                        }`}
                      />

                      <button
                        onClick={() => updateQuestion(qIndex, "correct", optIndex)}
                        className={`absolute right-2 top-2 w-6 h-6 rounded-full border-2 ${
                          q.correct === optIndex
                            ? "bg-green-500 border-green-600"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm">Time (s):</label>
                  <input
                    type="number"
                    value={q.time}
                    min={10}
                    max={120}
                    onChange={(e) =>
                      updateQuestion(qIndex, "time", Number(e.target.value))
                    }
                    className="px-3 py-1 border-2 rounded-lg w-20"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold">{q.question}</h3>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`px-4 py-2 rounded-lg ${
                        q.correct === i
                          ? "bg-green-100 border-2 border-green-500"
                          : "bg-gray-100"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Time: {q.time}s
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Start Quiz */}
      {questions.length > 0 && (
        <button
          onClick={onStartQuiz}
          className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:scale-105 transition flex items-center justify-center gap-2"
        >
          <Play className="w-6 h-6" /> Start Quiz ({questions.length} Questions)
        </button>
      )}
    </div>
  );
}
