
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, MealPlanResponse } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const identifyIngredients = async (base64Image: string): Promise<string[]> => {
  const ai = getAI();
  const prompt = "Identify food ingredients in this fridge. List only the ingredient names, comma separated.";
  const imagePart = { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: "image/jpeg" } };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: prompt }] }
    });
    return response.text?.split(',').map(i => i.trim()).filter(Boolean) || [];
  } catch { return []; }
};

export const generateMealPlan = async (prefs: UserPreferences): Promise<MealPlanResponse> => {
  const ai = getAI();

  const personaContext = prefs.persona ? `USER PERSONA: ${prefs.persona.profession}. 
    Current Mental/Emotional State: ${prefs.persona.mentalState}. 
    Today's Workload: ${prefs.persona.workload}.` : "";

  const fitnessContext = prefs.workoutPlanEnabled && prefs.selectedWorkoutDay 
    ? `FITNESS GOAL: Today is ${prefs.selectedWorkoutDay.day}. Workout: ${prefs.selectedWorkoutDay.activity}. Focus: ${prefs.selectedWorkoutDay.focus}.`
    : "FITNESS GOAL: General wellness.";

  const systemInstruction = `You are a holistic culinary logistics expert.
    CRITICAL CONSTRAINTS:
    1. INGREDIENT USAGE: For EVERY meal, you MUST use a minimum of 3 ingredients from the user's available list: [${prefs.ingredients.join(', ')}].
    2. USER CONTEXT: ${personaContext} ${fitnessContext}. Tailor recipes to their workload.
    3. DURATION: Exactly ${prefs.days} day(s).
    4. COST: Target ${prefs.cityType}. Use Indian market prices (₹).
    5. BUDGET: ₹${prefs.dailyBudget}/day limit.
    6. KITCHEN: Use ${prefs.kitchenSetup} only.
    7. MEAL LOGIC: Explain how each meal minimizes effort for their ${prefs.persona?.workload} workload and ${prefs.persona?.mentalState} state.
    8. OUTPUT: Group grocery list by Produce, Dairy, Pantry, Protein.`;

  const prompt = `Generate a high-performance ${prefs.days}-day meal plan. 
    Available Ingredients (MUST use at least 3 per meal): ${prefs.ingredients.join(', ')}.
    Diet: ${prefs.dietType}.
    Goal: Minimize steps, maximize efficiency.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  workoutInfo: { type: Type.STRING },
                  meals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        mealName: { type: Type.STRING },
                        type: { type: Type.STRING },
                        recipeTitle: { type: Type.STRING },
                        logicForWorkload: { type: Type.STRING },
                        ingredients: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              amount: { type: Type.STRING },
                              estimatedCost: { type: Type.NUMBER }
                            }
                          }
                        },
                        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        substitutions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        prepTime: { type: Type.NUMBER }
                      },
                      required: ["mealName", "type", "recipeTitle", "ingredients", "instructions", "substitutions", "prepTime", "logicForWorkload"]
                    }
                  },
                  dailyCookingSequence: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["dayNumber", "meals", "dailyCookingSequence"]
              }
            },
            groceryList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            totalEstimatedCost: { type: Type.NUMBER },
            budgetStatus: { type: Type.STRING },
            fitnessNote: { type: Type.STRING }
          },
          required: ["planTitle", "days", "groceryList", "totalEstimatedCost", "budgetStatus"]
        }
      }
    });

    return JSON.parse(response.text!) as MealPlanResponse;
  } catch (error) {
    throw new Error("Logic Synthesis Error: " + (error as Error).message);
  }
};

export const chatWithChef = async (messages: {role: string, text: string}[], currentPrefs: UserPreferences) => {
  const ai = getAI();
  const systemInstruction = `You are the Culinary Muse Chef. You are helping the user build a meal plan.
    Current available ingredients: ${currentPrefs.ingredients.join(', ')}.
    
    BEHAVIOR:
    1. Be concise, warm, and helpful.
    2. Acknowledge their mood and energy levels.
    3. If they mention being tired, suggest one-pot or minimal-prep meals.
    4. Remind them you'll use at least 3 of their own ingredients to minimize waste.
    5. Invite them to click "Generate Plan" once they've described their energy/day.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({ parts: [{ text: m.text }], role: m.role })),
    config: { systemInstruction }
  });
  return response.text;
};
