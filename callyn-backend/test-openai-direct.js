require('dotenv').config();
const { OpenAI } = require('openai');

// Test OpenAI connection without proxy first
async function testOpenAIDirect() {
  console.log('Testing OpenAI API connection without proxy...\n');
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    return;
  }
  
  console.log('✅ OpenAI API Key:', OPENAI_API_KEY.substring(0, 10) + '...');
  
  try {
    // Test without proxy first
    const openai = new OpenAI({ 
      apiKey: OPENAI_API_KEY,
      defaultHeaders: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });
    
    console.log('📡 Testing direct connection to OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hello! Just testing the connection. Please respond with "Connection successful!"'
        }
      ],
      max_tokens: 10
    });
    
    console.log('✅ Success!');
    console.log('📊 Response:', completion.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
      
      if (error.response.status === 403) {
        console.log('\n🚫 Access denied! This confirms the location restriction.');
        console.log('💡 The proxy should help bypass this restriction.');
      }
    }
  }
}

// Run the test
testOpenAIDirect().catch(console.error);
