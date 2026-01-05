/**
 * Visualization Mode Switcher
 * Handles switching between different visualization modes (Depth, Point Cloud, NVS)
 */

function setupVizSwitch(section) {
    const btns = section.querySelectorAll('.viz-btn');
    const contents = section.querySelectorAll('.viz-content');
    const descs = section.querySelectorAll('.viz-desc');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.viz;

            // Update buttons
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content
            contents.forEach(c => c.classList.remove('active'));
            const show = section.querySelector(`#viz-${target}`);
            if (show) show.classList.add('active');

            // Update description
            descs.forEach(d => {
                if (d.dataset.viz === target) {
                    d.classList.add('active');
                } else {
                    d.classList.remove('active');
                }
            });
        });
    });
}

// Initialize all visualization switchers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.section-card').forEach(card => {
        if (card.querySelector('.viz-switch')) {
            setupVizSwitch(card);
        }
    });
});
