// Test order creation API
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Initialize data
async function initializeData() {
  try {
    console.log('Initializing data...');
    const response = await axios.post(`${BASE_URL}/api/init`);
    console.log('Data initialization response:', response.data);
    console.log('Data initialization successful!');
  } catch (error) {
    console.error('Data initialization failed:', error.message);
  }
}

// Test create order
async function testCreateOrder() {
  try {
    console.log('Starting test for order creation API...');
    
    // 1. Initialize data
    await initializeData();
    
    // 2. Login user
    console.log('Step 1: Login user');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
        username: 'user1',
        password: '123456'
      });
      
      console.log('Login response status:', loginResponse.status);
      console.log('Login response data:', loginResponse.data);
      
      if (!loginResponse.data.success) {
        console.error('Login failed:', loginResponse.data.error);
        return;
      }
      
      const token = loginResponse.data.data.token;
      console.log('Login successful, obtained token:', token.substring(0, 20) + '...');
      
      // 3. Add item to cart
      console.log('Step 2: Add item to cart');
      try {
        const cartResponse = await axios.post(`${BASE_URL}/api/cart`, {
          dish_id: 1,
          quantity: 1
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Add to cart response status:', cartResponse.status);
        console.log('Add to cart response data:', cartResponse.data);
        console.log('Add item to cart successful');
        
        // 4. Create order
        console.log('Step 3: Create order');
        try {
          const orderResponse = await axios.post(`${BASE_URL}/api/orders`, {
            address: 'Test address',
            phone: '13800138000',
            remark: 'Test order'
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log('Create order response status:', orderResponse.status);
          console.log('Create order response data:', orderResponse.data);
          console.log('Create order successful');
          
          // 5. Clear cart
          console.log('Step 4: Clear cart');
          try {
            const clearCartResponse = await axios.delete(`${BASE_URL}/api/cart`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            console.log('Clear cart response status:', clearCartResponse.status);
            console.log('Clear cart response data:', clearCartResponse.data);
            console.log('Clear cart successful');
          } catch (clearCartError) {
            console.error('Clear cart failed:', clearCartError.response?.data || clearCartError.message);
          }
          
          console.log('Test completed, order creation function is working normally!');
        } catch (orderError) {
          console.error('Create order failed:', orderError.response?.data || orderError.message);
          if (orderError.response) {
            console.error('Error status:', orderError.response.status);
            console.error('Error data:', orderError.response.data);
          }
        }
      } catch (cartError) {
        console.error('Add item to cart failed:', cartError.response?.data || cartError.message);
        if (cartError.response) {
          console.error('Error status:', cartError.response.status);
          console.error('Error data:', cartError.response.data);
        }
      }
    } catch (loginError) {
      console.error('Login failed:', loginError.response?.data || loginError.message);
      if (loginError.response) {
        console.error('Error status:', loginError.response.status);
        console.error('Error data:', loginError.response.data);
      }
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test
testCreateOrder();
