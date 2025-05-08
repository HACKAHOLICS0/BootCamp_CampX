// Initialize the trainers carousel
document.addEventListener('DOMContentLoaded', function() {
  // Check if the carousel element exists
  const trainersCarousel = document.getElementById('trainersCarousel');
  if (trainersCarousel) {
    // Initialize the Bootstrap carousel
    new bootstrap.Carousel(trainersCarousel, {
      interval: 5000, // Change slides every 5 seconds
      wrap: true,     // Continuous loop
      touch: true     // Enable touch swiping on mobile
    });
  }
});
