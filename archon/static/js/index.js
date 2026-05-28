window.HELP_IMPROVE_VIDEOJS = false;


$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var options = {
			slidesToScroll: 1,
			slidesToShow: 1,
			loop: true,
			infinite: true,
			autoplay: true,
			autoplaySpeed: 5000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
	
    bulmaSlider.attach();

})

document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('.teaser-container video');
    const button = document.querySelector('.audio-toggle');
    const audioOn = document.querySelector('.audio-on');
    const audioOff = document.querySelector('.audio-off');

    button.addEventListener('click', function() {
        video.muted = !video.muted;
        
        if (video.muted) {
            audioOff.style.display = 'block';
            audioOn.style.display = 'none';
        } else {
            audioOff.style.display = 'none';
            audioOn.style.display = 'block';
        }
    });
});
