const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// System prompt for college assistant
const SYSTEM_PROMPT = `You are CampusGPT, an AI college assistant designed to help students with academic and campus-related queries.

ABOUT YOU:
- You help students with academic and campus-related queries
- You have access to timetable, faculty contacts, campus information
- You are patient, clear, and supportive
- You format responses in a readable way with emojis when appropriate

YOUR KNOWLEDGE BASE:
- Timetable: Students can ask about class schedules
- Faculty Contacts: You know professor emails and office locations  
- Campus Navigation: You can guide students around campus
- Exam Schedules: You have information about upcoming exams
- General College Info: You help with various student queries

RESPONSE GUIDELINES:
- Be concise but helpful
- Use bullet points or sections for complex information
- Add relevant emojis to make it friendly
- If you don't know something, suggest where they can find the information
- Always maintain a positive and supportive tone

IMPORTANT: You are specifically for college/university context.`;

async function generateResponse(userMessage) {
  try {
    console.log("🤖 Processing message with AI:", userMessage);
    
    // Check if API key is available
    if (!process.env.GOOGLE_API_KEY) {
      console.log("❌ API key missing in .env file");
      return "🔑 **AI Setup Required**: Please add your Google API key to the .env file. Get a FREE key from: https://aistudio.google.com/";
    }

    // Use the working model - gemini-2.5-flash!
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"  // This is the correct model that works!
    });

    const prompt = `${SYSTEM_PROMPT}\n\nStudent Question: ${userMessage}\n\nPlease provide a helpful response as CampusGPT:`;
    
    console.log("📤 Sending to Google AI...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ AI Response received successfully");
    return text;
    
  } catch (error) {
    console.error("❌ AI Error:", error);
    
    // User-friendly error messages
    if (error.message.includes("API_KEY") || error.message.includes("API key")) {
      return "🔑 **API Key Issue**: Please check your Google API key.";
    } else if (error.message.includes("quota") || error.message.includes("rate limit")) {
      return "📊 **Service Limit**: The AI service is currently busy. Please try again in a few moments!";
    } else {
      return "😅 **Temporary Issue**: I'm having trouble with the AI service right now. Please try again later!";
    }
  }
}

module.exports = { generateResponse };