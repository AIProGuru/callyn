require('dotenv').config();
const { SocksProxyAgent } = require('socks-proxy-agent');

// Test SOCKS proxy connection
async function testProxyConnection() {
  console.log('Testing SOCKS proxy connection...\n');
  
  const SOCKS_PROXY_URL = process.env.SOCKS_PROXY_URL;
  
  if (!SOCKS_PROXY_URL) {
    console.error('❌ SOCKS_PROXY_URL environment variable is not set');
    return;
  }
  
  console.log('🔗 Proxy URL:', SOCKS_PROXY_URL);
  
  try {
    // Create SOCKS proxy agent
    const agent = new SocksProxyAgent(SOCKS_PROXY_URL);
    console.log('✅ SOCKS proxy agent created successfully');
    
    // Test basic connectivity
    console.log('📡 Testing proxy connectivity...');
    
    // We'll test with a simple HTTP request to a known service
    const https = require('https');
    
    const options = {
      hostname: 'httpbin.org',
      port: 443,
      path: '/ip',
      method: 'GET',
      agent: agent,
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      console.log('✅ Proxy connection successful!');
      console.log('📊 Status:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('🌍 IP Address:', response.origin);
          console.log('✅ Proxy is working correctly!');
        } catch (e) {
          console.log('📄 Response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Proxy connection failed:', error.message);
      console.log('💡 This could mean:');
      console.log('   - The proxy server is down');
      console.log('   - The proxy credentials are incorrect');
      console.log('   - The proxy server is blocked');
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Proxy connection timed out');
      req.destroy();
    });
    
    req.end();
    
  } catch (error) {
    console.log('❌ Error creating proxy agent:', error.message);
  }
}

// Run the test
testProxyConnection().catch(console.error);
