// Video data - replace with your actual video files
const motionVideos = [
    { id: 1, title: "Walking Motion", filename: "walking.mp4" },
    { id: 2, title: "Running Motion", filename: "running.mp4" },
    { id: 3, title: "Jumping Motion", filename: "jumping.mp4" },
    { id: 4, title: "Dancing Motion", filename: "dancing.mp4" },
    { id: 5, title: "Fighting Motion", filename: "fighting.mp4" },
    { id: 6, title: "Idle Motion", filename: "idle.mp4" },
    { id: 7, title: "Climbing Motion", filename: "climbing.mp4" },
    { id: 8, title: "Sitting Motion", filename: "sitting.mp4" },
    { id: 9, title: "Gesturing Motion", filename: "gesturing.mp4" },
    { id: 10, title: "Complex Motion", filename: "complex.mp4" }
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadMotionVideos();
    setupSmoothScrolling();
    setupVideoControls();
});

// Load motion videos dynamically
function loadMotionVideos() {
    const videosGrid = document.getElementById('motion-videos');
    
    motionVideos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.innerHTML = `
            <video controls>
                <source src="assets/videos/${video.filename}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="video-info">
                <h4>${video.title}</h4>
            </div>
        `;
        videosGrid.appendChild(videoItem);
    });
}

// Setup smooth scrolling for navigation
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Adjust for navbar height
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Setup video controls and interactions
function setupVideoControls() {
    // Add event listeners for all videos
    document.addEventListener('play', function(e) {
        if (e.target.tagName === 'VIDEO') {
            // Pause other videos when one starts playing
            const allVideos = document.querySelectorAll('video');
            allVideos.forEach(video => {
                if (video !== e.target && !video.paused) {
                    video.pause();
                }
            });
        }
    }, true);
}

// Lazy load images for better performance
function setupLazyLoading() {
    const images = document.querySelectorAll('img');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => {
            if (img.dataset.src) {
                imageObserver.observe(img);
            }
        });
    }
}

// Add scroll animation for sections
function setupScrollAnimation() {
    const sections = document.querySelectorAll('section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });
}

// Add CSS for scroll animations
const style = document.createElement('style');
style.textContent = `
    section {
        opacity: 0;
        transform: translateY(50px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    section.visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Initialize animations
setupScrollAnimation();
setupLazyLoading();

// Mobile menu toggle (optional - can be added later)
function setupMobileMenu() {
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    menuToggle.style.cssText = `
        display: none;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #333;
        cursor: pointer;
    `;
    
    const navContainer = document.querySelector('.nav-container');
    navContainer.appendChild(menuToggle);
    
    menuToggle.addEventListener('click', function() {
        const navMenu = document.querySelector('.nav-menu');
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
    });
    
    // Show menu toggle on mobile
    if (window.innerWidth <= 768) {
        menuToggle.style.display = 'block';
        const navMenu = document.querySelector('.nav-menu');
        navMenu.style.display = 'none';
    }
}

// Call mobile menu setup
setupMobileMenu();

// Responsive menu handling
window.addEventListener('resize', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (window.innerWidth <= 768) {
        menuToggle.style.display = 'block';
        navMenu.style.display = 'none';
    } else {
        menuToggle.style.display = 'none';
        navMenu.style.display = 'flex';
    }
});