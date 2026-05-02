import { useState } from "react";

const SYSTEM_PROMPT = `You convert teacher questions into versions that work for students with aphantasia and SDAM. You preserve the exact academic task. You only change how the question asks for the thinking.
You are translating the question, not answering it, not guiding solutions, and not modeling an answer.
Your tone is calm, direct, and kind. You are on the student's side.

CORE RULES:
Never add facts, examples, definitions, or hints toward the answer.
Never narrow or broaden the original scope.
Only use subject-specific framing if it already appears in the original question.
If adding structure risks revealing the answer, simplify wording only and do not add steps.
Keep grade 6-10 readability: short sentences, concrete words.

STUDENT LANGUAGE MODE:
Use short, direct sentences.
Use common, everyday words.
Use action words.
Avoid formal or academic phrasing.

PREFERRED WORD CHOICES:
Instead of "identify" use "find"
Instead of "demonstrate" use "show"
Instead of "explain" use "tell how"
Instead of "evaluate" use "decide if"
Instead of "analyze" use "look at"
Instead of "classify" use "match or group"
Instead of "the material" use "what you were given"

QUESTION TYPE TEMPLATES:

Type A: General Concept ("What is X?")
Rewrite so the student can answer directly -- what kind of idea X is and what it refers to. Do not define X, list its features, or give examples. Do not produce a meta-question asking what the question wants.
"What is culture?" -- "Explain what culture is. Think about what kind of idea it is and what it refers to."
"What is a revolution?" -- "Explain what a revolution is. Think about what kind of change it describes and what would make something count as one."

Type B: Specific Content ("What is the X of Y?")
Short: Ask what information from what you were given is relevant.
Fuller: Ask what details from what you were given help answer the question.
"What is the culture of France?" -- Short: "What information from what you were given describes this place?" Fuller: "What details from what you were given help describe France?"

Type C: Comparison / Evaluation
Short: Ask students to choose their own comparison categories.
Fuller: Ask them to choose categories and show similarities and differences using details from what you were given.
"Compare France and Germany." -- Short: "Compare France and Germany. Choose categories. Use them to show similarities and differences." Fuller: "Compare France and Germany. Choose a few things that matter for the comparison and explain how they are alike or different using details from what you were given."
"Was the Treaty of Versailles fair?" -- Short: "Decide what fair means here." Fuller: "Decide what fair means for this question. Use evidence from what you were given to support your judgment."

Type D: Diagram / Data / Process / Math
Short: Focus on structure, relationships, and change.
Fuller: Ask what the structure shows, how parts connect, or what changes over time.
"Analyze the graph." -- Short: "Look at the graph. Find patterns. Note what changes over time." Fuller: "Describe what changes appear in the graph over time. Look for patterns and shifts."
"Label the parts of the cell." -- Short: "Match each part to its name." Fuller: "Use the description of each part to match it to the correct name."

APHANTASIA CONVERSIONS:
"Imagine you are a colonist" -- Short: "Describe what a colonist would experience." Fuller: "Based on what you were given, describe what life would have been like as a colonist."
"Picture the scene" -- Short: "List the details about the scene." Fuller: "List the specific details that describe the scene."
"Draw a diagram" -- Short: "Explain the parts and how they connect." Fuller: "Describe each part and explain how the parts relate to each other."
"Visualize emotions" -- Short: "Find what shows the emotions." Fuller: "Find the details that show the emotions involved."

SDAM CONVERSIONS:
"Think about a time when you..." -- Short: "What does what you were given show about someone in this situation?" Fuller: "Using what you were given, describe what someone in this situation would experience."
"How did your understanding change?" -- Short: "What is shown at the start? What is shown later?" Fuller: "What does what you were given show about this topic at the beginning, and what does it show later?"
"Reflect on your experience" -- Short: "Use details from what you were given." Fuller: "Use specific details from what you were given to respond to this question."
"What did you learn?" -- Short: "What does what you were given show about this topic?" Fuller: "Based on what you were given, what does the material show about this topic?"

Never ask or imply changes in personal memory, thinking over time, or self-reflection.

WHEN NO REWRITE IS NEEDED:
If the question is already clear and does not need imagery or memory-recall support, say:
"This question is already written in a way you can work with directly."
Then continue with WHAT THIS IS ACTUALLY ASKING FOR and HOW TO APPROACH IT as normal.
Do not use the words "aphantasia" or "SDAM" anywhere in your output.

SAFETY CHECK:
Before outputting, verify:
Did I avoid defining concepts in Type A?
Did I avoid facts, examples, or explanations?
Did I preserve the original task?
Did I avoid guiding what a "good answer" looks like?
Would copying this answer the question? If yes, revise.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

REWRITTEN QUESTION:
[For Type A: fuller rewrite only -- one complete version the student can work from]
[For all other types: short version first, fuller version below]

WHAT THIS IS ACTUALLY ASKING FOR:
[One or two plain sentences explaining what kind of answer the teacher wants -- no facts, no hints]

HOW TO APPROACH IT:
Step 1
Step 2
Step 3

IF VISUALIZATION OR MEMORY WAS INVOLVED:
[Brief note on what to use instead -- only include this section if the original question had imagery or memory-recall language]`;

const LoadingDots = () => (
  <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: "50%",
        background: "#fff", display: "inline-block",
        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
    <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
  </span>
);

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
       headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: input.trim() }],
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "";
      const rewrittenMatch = text.match(/REWRITTEN QUESTION:\n([\s\S]*?)(?=\n\nWHAT THIS IS ACTUALLY ASKING FOR:|$)/);
      const askingMatch = text.match(/WHAT THIS IS ACTUALLY ASKING FOR:\n([\s\S]*?)(?=\n\nHOW TO APPROACH IT:|$)/);
      const approachMatch = text.match(/HOW TO APPROACH IT:\n([\s\S]*?)(?=\n\nIF VISUALIZATION OR MEMORY WAS INVOLVED:|$)/);
      const visualMatch = text.match(/IF VISUALIZATION OR MEMORY WAS INVOLVED:\n([\s\S]*?)$/);
      setOutput({
        rewritten: rewrittenMatch ? rewrittenMatch[1].trim() : text,
        asking: askingMatch ? askingMatch[1].trim() : null,
        approach: approachMatch ? approachMatch[1].trim() : null,
        visual: visualMatch ? visualMatch[1].trim() : null,
      });
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = output.rewritten
      + (output.approach ? "\n\nHow to approach it:\n" + output.approach : "")
      + (output.visual ? "\n\nInstead of visualizing or recalling:\n" + output.visual : "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput(""); setOutput(null); setError(null);
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", maxWidth: 700, margin: "0 auto", padding: "2rem 1.5rem", color: "#1a1a1a" }}>
      <style>{`
        *{box-sizing:border-box;}
        textarea{
          width:100%; min-height:150px; padding:14px 16px;
          font-family:'Georgia',serif; font-size:15px; line-height:1.65;
          border:1.5px solid #9FE1CB; border-radius:10px;
          background:#F9FEFC; color:#1a1a1a; resize:vertical; outline:none;
          transition:border-color 0.2s, background 0.2s;
        }
        textarea:focus{border-color:#1D9E75; background:#fff;}
        textarea::placeholder{color:#7ab8a8; font-style:italic;}
        textarea:disabled{background:#f0f0f0; color:#888;}
        .btn{
          border:none; border-radius:8px; padding:10px 22px;
          font-size:14px; font-family:'Georgia',serif; cursor:pointer;
          transition:background 0.15s, transform 0.1s; letter-spacing:0.01em;
        }
        .btn:active:not(:disabled){transform:scale(0.98);}
        .btn-primary{background:#0F6E56; color:#fff;}
        .btn-primary:hover:not(:disabled){background:#085041;}
        .btn-primary:disabled{background:#9FE1CB; cursor:not-allowed;}
        .btn-ghost{background:transparent; color:#0F6E56; border:1.5px solid #9FE1CB;}
        .btn-ghost:hover{background:#E1F5EE;}
        .fade-in{animation:fadeIn 0.35s ease;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .tag{
          display:inline-block; font-size:11px; font-style:italic;
          background:#E1F5EE; color:#085041; border-radius:20px;
          padding:2px 10px; margin-right:5px;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "#E1F5EE", border: "2px solid #5DCAA5",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>&#128270;</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: "bold", margin: 0, color: "#085041", letterSpacing: "-0.02em" }}>
              Question Translator
            </h1>
            <p style={{ fontSize: 13, color: "#5F5E5A", margin: 0 }}>for students with aphantasia and SDAM</p>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "#444441", margin: 0, lineHeight: 1.7, borderLeft: "3px solid #9FE1CB", paddingLeft: 12 }}>
          Paste a homework or test question below. This tool rewrites it so it works without needing to
          picture anything in your head or replay a personal memory.
        </p>
      </div>

      {/* Input */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: "bold", color: "#085041", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Paste your question here
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={`Try pasting questions like:\n\n"Imagine you are a soldier in WWI. Write a diary entry describing what you see and feel."\n\nor\n\n"Think back to a time you solved a hard problem. Describe the steps you took."`}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: "1.5rem" }}>
        {(input || output) && (
          <button className="btn btn-ghost" onClick={handleClear} disabled={loading}>Clear</button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleTranslate}
          disabled={loading || !input.trim()}
        >
          {loading
            ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}>Translating <LoadingDots /></span>
            : "Translate question"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#FCEBEB", border: "1px solid #F09595", borderRadius: 8, padding: "0.9rem 1.1rem", color: "#A32D2D", fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="fade-in" style={{ border: "1.5px solid #5DCAA5", borderRadius: 12, padding: "1.4rem 1.5rem", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: "bold", color: "#085041", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Translated version
            </span>
            <span className="tag">aphantasia-friendly</span>
            <span className="tag">SDAM-friendly</span>
          </div>

          <p style={{ fontSize: 15.5, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap", color: "#1a1a1a" }}>
            {output.rewritten}
          </p>

          {output.asking && (
            <div style={{
              marginTop: "1.1rem",
              background: "#F5F0FF",
              borderLeft: "4px solid #9B7FD4",
              borderRadius: "0 8px 8px 0",
              padding: "0.85rem 1rem",
            }}>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "#5B3FA6", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                What this is actually asking for
              </p>
              <p style={{ fontSize: 14, color: "#3D2875", margin: 0, lineHeight: 1.65 }}>
                {output.asking}
              </p>
            </div>
          )}

          {output.approach && (
            <div style={{
              marginTop: "1.1rem",
              background: "#E1F5EE",
              borderLeft: "4px solid #1D9E75",
              borderRadius: "0 8px 8px 0",
              padding: "0.85rem 1rem",
            }}>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "#0F6E56", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
                How to approach it
              </p>
              <p style={{ fontSize: 14, color: "#085041", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {output.approach}
              </p>
            </div>
          )}

          {output.visual && (
            <div style={{
              marginTop: "0.75rem",
              background: "#FDF6E3",
              borderLeft: "4px solid #C8A84B",
              borderRadius: "0 8px 8px 0",
              padding: "0.85rem 1rem",
            }}>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "#7A6020", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                Instead of visualizing or recalling
              </p>
              <p style={{ fontSize: 14, color: "#5A4510", margin: 0, lineHeight: 1.65 }}>
                {output.visual}
              </p>
            </div>
          )}

          <div style={{ marginTop: "1.1rem", paddingTop: "0.9rem", borderTop: "1px solid #9FE1CB", display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: "7px 14px" }} onClick={handleCopy}>
              {copied ? "Copied!" : "Copy translation"}
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: "7px 14px" }} onClick={handleClear}>
              Try another question
            </button>
          </div>
        </div>
      )}

      {/* Footer explainer */}
      <div style={{ marginTop: "2rem", background: "#F1EFE8", borderRadius: 10, padding: "1rem 1.2rem", fontSize: 13, color: "#5F5E5A", lineHeight: 1.7 }}>
        <strong style={{ color: "#2C2C2A", display: "block", marginBottom: 3 }}>How this works</strong>
        Aphantasia means you cannot form mental images. SDAM means you cannot mentally replay personal memories the way most people do. Both are real neurological differences, and lots of school questions accidentally assume you can do these things. This tool rewrites those questions so you can answer them fully, using what you actually know and think.
      </div>
    </div>
  );
}
