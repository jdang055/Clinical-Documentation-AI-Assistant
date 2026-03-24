/* ===== COMPONENT: STATE & CONFIGURATION ===== */

// 🚀 REAL LLM INTEGRATION: Paste your Google Gemini API key right here!
// (You can get a free key instantly at https://aistudio.google.com/)
// If left blank, the app gracefully falls back to the simulated mock LLM.
const API_KEY = ""; 

// Using structured object for accurate DOM references prevents polluting global namespace
const DOM = {
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnGenerate: document.getElementById('btnGenerate'),
    btnCopy: document.getElementById('btnCopy'),
    btnExportPdf: document.getElementById('btnExportPdf'),
    transcriptInput: document.getElementById('transcriptInput'),
    complianceToggle: document.getElementById('complianceToggle'),
    
    // Output States
    emptyState: document.getElementById('emptyState'),
    loadingState: document.getElementById('loadingState'),
    soapContent: document.getElementById('soapContent'),
    
    // Content Areas
    soapSubjective: document.getElementById('soapSubjective'),
    soapObjective: document.getElementById('soapObjective'),
    soapAssessment: document.getElementById('soapAssessment'),
    soapPlan: document.getElementById('soapPlan'),
    
    // Evaluation Metrics
    metricCompleteness: document.getElementById('metricCompleteness'),
    barCompleteness: document.getElementById('barCompleteness'),
    metricHallucination: document.getElementById('metricHallucination'),
    metricAccuracy: document.getElementById('metricAccuracy'),
    barAccuracy: document.getElementById('barAccuracy')
};

// Dynamic Simulation State
let CURRENT_SOAP = { subjective: "", objective: "", assessment: "", plan: "" };
let CURRENT_METRICS = { completeness: 0, hallucinationRisk: 'High', accuracy: 0 };

const SAMPLE_TRANSCRIPT = `Patient: 65M
CC: SOB + chronic cough

HPI:  
Pt w/ 3 mo hx of persistent cough + progressive SOB. Worse w/ exertion. Occasional wheeze. No fever/chills/CP. No recent URI. 30 pack‑yr smoker. Using albuterol PRN w/ partial relief. No recent hospitalizations. Denies orthopnea, PND, LE edema.

Vitals:  
BP 135/85, HR 88, RR 20, SpO₂ 93% RA.

Exam:  
Gen: NAD.
Lungs: ↓ breath sounds bilat, mild exp wheeze, no crackles.
CV: RRR, no m/r/g.
Ext: No edema.
No cyanosis.

Assessment:  
Chronic cough + exertional dyspnea in smoker. Likely COPD; possible mild exacerbation.

Plan:  
ICS inhaler. Continue albuterol PRN. CXR + PFTs ordered. Smoking cessation discussed; pt interested. F/u after results.`;

const MEDICAL_ENTITIES = [
    { text: "SOB", type: "symptom" },
    { text: "cough", type: "symptom" },
    { text: "wheeze", type: "symptom" },
    { text: "fever", type: "symptom" },
    { text: "chills", type: "symptom" },
    { text: "CP", type: "symptom" },
    { text: "orthopnea", type: "symptom" },
    { text: "edema", type: "symptom" },
    { text: "dyspnea", type: "symptom" },
    { text: "crackles", type: "symptom" },
    { text: "cyanosis", type: "symptom" },
    { text: "albuterol", type: "medication" },
    { text: "ICS inhaler", type: "medication" },
    { text: "COPD", type: "diagnosis" }
];

// Helper to highlight terms securely anywhere on the screen
function highlightText(text) {
    let html = text.replace(/\n/g, '<br>');
    if (!html) return html;
    MEDICAL_ENTITIES.forEach(entity => {
        // \b ensures we only highlight exact words (preventing "CP" from highlighting inside "CPR")
        const regex = new RegExp(`\\b(${entity.text})\\b`, 'gi');
        html = html.replace(regex, `<span class="hl-${entity.type}">$1</span>`);
    });
    return html;
}

/* ===== COMPONENT: INITIALIZATION ===== */

document.addEventListener('DOMContentLoaded', () => {
    handlePlaceholder(); // Initialize custom placeholder state
    DOM.transcriptInput.addEventListener('input', handlePlaceholder);

    // Bind interaction logic to buttons
    DOM.btnLoadSample.addEventListener('click', loadSampleCase);
    DOM.btnGenerate.addEventListener('click', generateClinicalNote);
    DOM.btnCopy.addEventListener('click', copyToClipboard);
    DOM.btnExportPdf.addEventListener('click', exportPdf);
    
    // Toggle triggers immediately if note is already fully visible
    DOM.complianceToggle.addEventListener('change', updateMetrics);
});

/* ===== COMPONENT: CORE LOGIC ===== */

/**
 * Simulates a placeholder for a contenteditable div since native HTML doesn't support them perfectly.
 */
function handlePlaceholder() {
    const el = DOM.transcriptInput;
    if (el.textContent.trim() === '') el.setAttribute('empty', '');
    else el.removeAttribute('empty');
}

/**
 * Injects sample case text into the textarea equivalent while adding span highlights securely.
 */
function loadSampleCase() {
    // Inject the sample text and apply the new exact-match highlighting
    DOM.transcriptInput.innerHTML = highlightText(SAMPLE_TRANSCRIPT);
    handlePlaceholder();
}

/**
 * Handles the "AI Generation" workflow seamlessly fading states from Empty -> Loading -> Filled
 */
/**
 * Simulated LLM API Call: Parses dynamic input to generate an orchestrated SOAP + Metrics state
 */
function simulateLLM(inputText) {
    const rawText = inputText.toLowerCase();
    
    // 1. Dynamic Metric Calculation based on the user's grading rubric
    let completeness = 30; // Base baseline score
    
    // Scoring Rubric checking logic:
    if (rawText.includes('vitals') || rawText.includes('bp ') || rawText.includes('hr ')) completeness += 20;
    if (rawText.includes('hx') || rawText.includes('history') || rawText.includes('cc:')) completeness += 15;
    if (rawText.includes('exam') || rawText.includes('lungs') || rawText.includes('cv')) completeness += 15;
    if (rawText.includes('plan') || rawText.includes('ordered') || rawText.includes('f/u')) completeness += 20;

    // Fast Mode penalty (simulating a less contextually aware model)
    if (!DOM.complianceToggle.checked) completeness -= 15;

    // Lock bounds accurately between 0 and 100
    completeness = Math.max(0, Math.min(100, completeness)); 

    // Accuracy ties heavily to completeness and text length in this simulation
    let accuracy = Math.min(100, completeness + Math.floor(Math.random() * 8)); 
    if (rawText.length < 100) accuracy -= 20;

    // Hallucination Risk Tiers mathematically aligned to completeness
    let hallucinationRisk = 'Large';
    if (completeness >= 85) hallucinationRisk = 'Small';
    else if (completeness >= 60) hallucinationRisk = 'Medium';

    CURRENT_METRICS = { completeness, accuracy, hallucinationRisk };

    // 2. Ultra-Smart Parsing (Hybrid LLM Header/Fuzzy Classification)
    const lines = inputText.split('\n');
    let s = "", o = "", a = "", p = "";
    
    // Check if the user used explicit formatting anywhere in their text
    const hasHeaders = lines.some(line => line.toLowerCase().match(/^(objective|vitals|exam|assessment|plan|o:|a:|p:)/));

    if (hasHeaders) {
        // STRICT MODE: Maintain paragraph structure based on detected headers
        let currentBucket = 's';
        lines.forEach(line => {
            const lower = line.toLowerCase().trim();
            if (!lower) return;
            
            // Trigger bucket switches when headers are isolated
            if (lower.match(/^(objective|vitals|exam|o:|o\s+-)/)) currentBucket = 'o';
            else if (lower.match(/^(assessment|a:|a\s+-)/)) currentBucket = 'a';
            else if (lower.match(/^(plan|p:|p\s+-)/)) currentBucket = 'p';
            else if (lower.match(/^(subjective|hpi|cc:|patient|s:|s\s+-)/)) currentBucket = 's';
            
            if (currentBucket === 's') s += line + '\n';
            else if (currentBucket === 'o') o += line + '\n';
            else if (currentBucket === 'a') a += line + '\n';
            else if (currentBucket === 'p') p += line + '\n';
        });
    } else {
        // FUZZY NLP MODE: The user inputted unstructured scribbles without any colons!
        // We playfully split the entire chunk of text into generic grammatical sentences and classify them based on clinical keywords.
        const sentences = inputText.match(/[^.!?\n]+[.!?\n]*/g) || [inputText];
        
        sentences.forEach(sentence => {
            const lower = sentence.toLowerCase().trim();
            if (!lower) return;
            
            // Keyword clustering score simulating statistical LLM embeddings
            let sScore = 0, oScore = 0, aScore = 0, pScore = 0;
            
            if (lower.match(/\b(bp|hr|rr|spo2|vitals|exam|nad|lungs|cv|clear|rate)\b/)) oScore += 2;
            if (lower.match(/\b(suspect|likely|diagnosis|impression|secondary to|exacerbation)\b/)) aScore += 2;
            if (lower.match(/\b(plan|order|prescribe|start|continue|stop|follow up|f\/u|referral|counsel)\b/)) pScore += 2;
            if (lower.match(/\b(history|hx|complains|reports|denies|feels|pain|symptom|ago)\b/)) sScore += 2;
            
            // Pipe the sentence into the highest scoring bucket
            if (oScore > Math.max(sScore, aScore, pScore)) o += sentence + ' ';
            else if (aScore > Math.max(sScore, oScore, pScore)) a += sentence + ' ';
            else if (pScore > Math.max(sScore, oScore, aScore)) p += sentence + ' ';
            else s += sentence + ' '; // Default to subjective if incredibly vague
        });
    }

    CURRENT_SOAP = {
        subjective: s.trim() || "Patient history not explicitly stated.",
        objective: o.trim() || "No objective vitals or exam details identified.",
        assessment: a.trim() || "Awaiting clinical assessment.",
        plan: p.trim() || "Plan not explicitly formulated."
    };
}

/**
 * 🚀 REAL LLM API CALL: Connects directly to Google's Gemini 1.5 Flash Model!
 */
async function callRealLLM(transcript, isSafeMode) {
    const prompt = `
    You are an expert Clinical AI Assistant. Read the following doctor-patient transcript and generate a highly professional SOAP note based on strict medical guidelines.
    Your output MUST be a valid JSON object with the following exact keys:
    "subjective", "objective", "assessment", "plan", "completeness" (number 0-100), "accuracy" (number 0-100), and "hallucinationRisk" ("Low", "Medium", or "High").
    
    Mode constraint: ${isSafeMode ? "Strict Medical Compliance (Be very conservative, do not hallucinate)." : "Fast Mode (Infer likely details)."}
    
    Transcript:
    ${transcript}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            // Force the AI to perfectly return formatted JSON data!
            generationConfig: { response_mime_type: "application/json" }
        })
    });

    if (!response.ok) {
        let errMessage = "Unknown Network or API Key Error";
        try {
            const errData = await response.json();
            errMessage = errData.error?.message || errMessage;
        } catch(e) {}
        throw new Error(`Google API [Status ${response.status}]: ${errMessage}`);
    }
    
    const data = await response.json();
    let jsonText = data.candidates[0].content.parts[0].text;
    
    // Cleanse markdown block if Gemini hallucinated formatting
    jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(jsonText);
}

async function generateClinicalNote() {
    // Utilize innerText to extract pure raw text while preserving visual line breaks (\n)! 
    // textContent strips <br> tags into a single line, which breaks our parser.
    const rawInput = DOM.transcriptInput.innerText.trim();
    if (rawInput === '') {
        alert("Please enter a transcript first.");
        return;
    }

    DOM.emptyState.classList.add('hidden');
    DOM.soapContent.classList.add('hidden');
    DOM.loadingState.classList.remove('hidden');

    try {
        if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
            console.warn("No API Key detected! Falling back to the simulated local LLM engine.");
            simulateLLM(rawInput);
            await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
            console.log("🚀 Firing real request to Gemini AI...");
            const llmResponse = await callRealLLM(rawInput, DOM.complianceToggle.checked);
            
            // Map the real AI response directly into our application state!
            CURRENT_SOAP = {
                subjective: llmResponse.subjective,
                objective: llmResponse.objective,
                assessment: llmResponse.assessment,
                plan: llmResponse.plan
            };
            CURRENT_METRICS = {
                completeness: llmResponse.completeness,
                accuracy: llmResponse.accuracy,
                hallucinationRisk: llmResponse.hallucinationRisk
            };
        }
    } catch (error) {
        console.error("LLM Full Error:", error);
        alert(`AI Integration Error:\n${error.message}\n\nTip: If the API error is 'API key not valid', check that you copied the entire key from https://aistudio.google.com/.`);
        
        // Revert UI state on failure
        DOM.loadingState.classList.add('hidden');
        DOM.emptyState.classList.remove('hidden');
        return;
    }

    DOM.loadingState.classList.add('hidden');
    DOM.soapContent.classList.remove('hidden');

    DOM.soapSubjective.innerHTML = '';
    DOM.soapObjective.innerHTML = '';
    DOM.soapAssessment.innerHTML = '';
    DOM.soapPlan.innerHTML = '';

    // Stream purely the raw text first for the typewriter animation
    // Then instantly replace with the highlighted version generated from regex
    await typeText(DOM.soapSubjective, CURRENT_SOAP.subjective, 10);
    DOM.soapSubjective.innerHTML = highlightText(CURRENT_SOAP.subjective);

    await typeText(DOM.soapObjective, CURRENT_SOAP.objective, 10);
    DOM.soapObjective.innerHTML = highlightText(CURRENT_SOAP.objective);

    await typeText(DOM.soapAssessment, CURRENT_SOAP.assessment, 10);
    DOM.soapAssessment.innerHTML = highlightText(CURRENT_SOAP.assessment);

    await typeText(DOM.soapPlan, CURRENT_SOAP.plan, 10);
    DOM.soapPlan.innerHTML = highlightText(CURRENT_SOAP.plan);

    updateMetrics();
}

/**
 * Educational Moment: Using JavaScript Promises and recursive 'setTimeout' 
 * allows us to simulate an asynchronous typing effect, making the UI feel "alive".
 */
function typeText(element, text, speed) {
    return new Promise(resolve => {
        let i = 0;
        element.classList.add('typing'); 
        element.innerHTML = ""; 
        
        function type() {
            if (i < text.length) {
                // Ensure new lines render as HTML breaks properly
                element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                element.classList.remove('typing'); 
                resolve();
            }
        }
        type(); // Start loop
    });
}

/**
 * Updates the Data Panel logic dynamically depending on the Safe Mode / Fast Mode switch state.
 */
function updateMetrics() {
    if (DOM.soapContent.classList.contains('hidden')) return; // Ignore if blank

    // Re-run simulation dynamically if they flip the toggle post-generation
    const rawInput = DOM.transcriptInput.textContent.trim();
    simulateLLM(rawInput);
    
    const stats = CURRENT_METRICS;

    DOM.metricCompleteness.textContent = `${stats.completeness}%`;
    DOM.metricAccuracy.textContent = `${stats.accuracy}%`;
    
    DOM.barCompleteness.style.width = `${stats.completeness}%`;
    DOM.barAccuracy.style.width = `${stats.accuracy}%`;

    const badge = DOM.metricHallucination;
    badge.textContent = stats.hallucinationRisk;
    badge.className = 'metric-value status-badge'; // reset class
    
    if (stats.hallucinationRisk === 'Small') badge.classList.add('badge-success');
    else if (stats.hallucinationRisk === 'Medium') badge.classList.add('badge-warning');
    else badge.classList.add('badge-danger');
}

/* ===== COMPONENT: ACTION EXPORTS ===== */

function copyToClipboard() {
    if (DOM.soapContent.classList.contains('hidden')) return;
    
    const fullText = `
SUBJECTIVE:
${CURRENT_SOAP.subjective}

OBJECTIVE:
${CURRENT_SOAP.objective}

ASSESSMENT:
${CURRENT_SOAP.assessment}

PLAN:
${CURRENT_SOAP.plan}
    `.trim();

    navigator.clipboard.writeText(fullText).then(() => {
        // Temporary UI confirmation feedback
        DOM.btnCopy.innerHTML = `<i class="ph ph-check" style="color:var(--success)"></i> Copied`;
        setTimeout(() => DOM.btnCopy.innerHTML = `<i class="ph ph-copy"></i> Copy`, 2000);
    });
}

function exportPdf() {
    if (DOM.soapContent.classList.contains('hidden')) return;
    // Invokes the native browser print UI (our print.css hides all UI framing inside of it)
    window.print();
}
