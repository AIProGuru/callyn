require('dotenv').config();
const { OpenAI } = require('openai');
const { SocksProxyAgent } = require('socks-proxy-agent');

// Test OpenAI connection with proxy
async function testOpenAIConnection() {
  console.log('Testing OpenAI API connection with proxy...\n');
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const SOCKS_PROXY_URL = process.env.SOCKS_PROXY_URL;
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    return;
  }
  
  console.log('✅ OpenAI API Key:', OPENAI_API_KEY.substring(0, 10) + '...');
  console.log('🔗 Proxy URL:', SOCKS_PROXY_URL || 'None (Direct connection)');
  
  try {
    // Configure OpenAI with proxy if available
    const openaiConfig = {
      apiKey: OPENAI_API_KEY,
    };
    
    // Add proxy configuration if available
    if (SOCKS_PROXY_URL) {
      console.log('🌐 Using SOCKS proxy for OpenAI...');
      const agent = new SocksProxyAgent(SOCKS_PROXY_URL);
      openaiConfig.httpAgent = agent;
      openaiConfig.httpsAgent = agent;
    }
    
    const openai = new OpenAI(openaiConfig);
    
    // Test with a simple OpenAI request
    console.log('📡 Testing connection to OpenAI API...');
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
        console.log('\n🚫 Access denied! This could mean:');
        console.log('   - Your API key is invalid');
        console.log('   - Your location is not supported');
        console.log('   - The proxy might not be working correctly');
      }
    }
  }
}

// Run the test
testOpenAIConnection().catch(console.error);
