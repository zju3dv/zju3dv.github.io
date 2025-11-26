// Simple carousel initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bulma carousel if available
    if (typeof bulmaCarousel !== 'undefined') {
        bulmaCarousel.attach('#results-carousel', {
            slidesToScroll: 1,
            slidesToShow: 1,
            infinite: true,
            autoplay: false
        });
    }
});
