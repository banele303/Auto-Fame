// Test script to verify the review API
async function testReviewAPI() {
  try {
    const reviewData = {
      rating: 5,
      title: "Test Review",
      comment: "This is a test review",
      carId: 1,
      customerId: "temp-customer-1",
      customerName: "Test Customer",
      customerEmail: "test@example.com"
    };

    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      console.log('Review created successfully!');
    } else {
      console.error('Review creation failed');
    }
  } catch (error) {
    console.error('Error testing review API:', error);
  }
}

// Call the test function
testReviewAPI();
