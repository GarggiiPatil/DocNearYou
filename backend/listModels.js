// listModels.js - Check which Gemini models are available for your API key
// Run this: node listModels.js

require('dotenv').config();
const axios = require('axios');

async function listAvailableModels() {
  console.log('========================================');
  console.log('🔍 Finding Available Gemini Models');
  console.log('========================================\n');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in .env file\n');
    return;
  }

  console.log('🔑 API Key found, checking available models...\n');

  try {
    // List all available models
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.models) {
      const models = response.data.models;
      
      // Filter models that support generateContent
      const contentModels = models.filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      );

      console.log('✅ Found', contentModels.length, 'models that support text generation:\n');
      
      contentModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log('');
      });

      // Recommend the best model
      console.log('========================================');
      console.log('📝 Recommendation:');
      console.log('========================================\n');
      
      if (contentModels.length > 0) {
        const recommendedModel = contentModels[0].name.replace('models/', '');
        console.log('Use this model in your code:', recommendedModel);
        console.log('\nI will now update your chatbot to use this model...\n');
        return recommendedModel;
      } else {
        console.log('❌ No suitable models found for your API key.');
        console.log('Try generating a new API key from: https://aistudio.google.com/app/apikey\n');
        return null;
      }

    } else {
      console.error('❌ Unexpected response format:', response.data);
      return null;
    }

  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Error Details:', error.response.data);
      
      if (error.response.status === 403) {
        console.log('\n💡 Your API key is invalid or restricted.');
        console.log('Generate a new API key from: https://aistudio.google.com/app/apikey\n');
      }
    }
    return null;
  }
}

// Run the script
listAvailableModels();