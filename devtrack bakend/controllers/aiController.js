const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Auto-generate subtasks from task description
exports.generateSubtasks = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // Updated model to gemini-3.6-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are an expert technical project manager. Given the following software development task:
Title: "${title}"
Description: "${description || 'N/A'}"

Break this task down into 3 to 5 clear, concise, actionable subtasks or technical acceptance criteria. Return a JSON array of strings, like: ["Subtask 1", "Subtask 2", "Subtask 3"].`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    let subtasks = [];
    try {
      subtasks = JSON.parse(responseText);
    } catch (parseErr) {
      subtasks = [responseText];
    }

    res.json({ success: true, subtasks });
  } catch (error) {
    next(error);
  }
};

// 2. Summarize messy bug reports
exports.summarizeBug = async (req, res, next) => {
  try {
    const { rawBugReport } = req.body;

    if (!rawBugReport) {
      return res.status(400).json({ message: 'Raw bug report text is required' });
    }

    // Updated model to gemini-3.6-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `Summarize the following raw bug report into a structured format containing:
1. Short Executive Summary (1-2 sentences)
2. Likely Root Cause
3. Recommended Fix Steps

Bug Report:
"${rawBugReport}"`;

    const result = await model.generateContent(prompt);
    res.json({ success: true, summary: result.response.text() });
  } catch (error) {
    next(error);
  }
};