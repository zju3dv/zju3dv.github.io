/**
 * Visualization Mode Switcher
 * Handles switching between different visualization modes (Depth, Point Cloud, NVS)
 */

function switchToMode(section, mode) {
    const btns = section.querySelectorAll('.viz-btn');
    const contents = section.querySelectorAll('.viz-content');
    const descs = section.querySelectorAll('.viz-desc');

    // Update buttons
    btns.forEach(b => {
        if (b.dataset.viz === mode) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    // Update content
    contents.forEach(c => c.classList.remove('active'));
    const show = section.querySelector(`#viz-${mode}`);
    if (show) show.classList.add('active');

    // Update description
    descs.forEach(d => {
        if (d.dataset.viz === mode) {
            d.classList.add('active');
        } else {
            d.classList.remove('active');
        }
    });
}

function setupVizSwitch(section) {
    const btns = section.querySelectorAll('.viz-btn');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.viz;
            switchToMode(section, target);

            // Update URL hash without scrolling
            if (section.closest('#qualitative-viz')) {
                history.replaceState(null, null, `#${target}`);
            }
        });
    });
}

// Handle hash navigation
function handleHashNavigation() {
    const hash = window.location.hash.substring(1); // Remove the '#'
    if (hash) {
        const vizSection = document.querySelector('#qualitative-viz .section-card');
        if (vizSection) {
            const validModes = ['depth', 'pointcloud', 'nvs', 'nvs-interactive'];
            if (validModes.includes(hash)) {
                switchToMode(vizSection, hash);

                // Scroll to the section
                setTimeout(() => {
                    const section = document.getElementById('qualitative-viz');
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 300);
            }
        }
    }
}

// Initialize all visualization switchers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.section-card').forEach(card => {
        if (card.querySelector('.viz-switch')) {
            setupVizSwitch(card);
        }
    });

    // Handle URL hash on page load (with delay to ensure all content is loaded)
    setTimeout(() => {
        handleHashNavigation();
    }, 500);

    // Handle hash changes (when user clicks back/forward or changes hash)
    window.addEventListener('hashchange', function() {
        handleHashNavigation();
    });
});
