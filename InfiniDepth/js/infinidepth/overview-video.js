/**
 * Overview Video Controller
 * Handles video playback controls and stage button highlighting
 */

(function() {
    const video = document.getElementById('overviewVideo');
    if (!video) return;

    const btns = [
        document.getElementById('stage-btn-1'),
        document.getElementById('stage-btn-2'),
        document.getElementById('stage-btn-3'),
    ];

    // Stage thresholds for highlighting
    const stageThresholds = [2, 18, 24];

    // Seek time points
    const seekTimes = [2, 18, 24];

    // User override priority lock
    let userOverrideIdx = null;
    let userOverrideUntil = 0;
    let pendingSeek = null;

    function setActive(idx) {
        btns.forEach((b, i) => b && b.classList.toggle('active', i === idx));
    }

    function getAutoStageIdx(t) {
        if (t >= stageThresholds[2]) return 2;
        if (t >= stageThresholds[1]) return 1;
        return 0;
    }

    function doSeekTo(idx) {
        const seekTo = () => {
            const target = seekTimes[idx];
            // Highlight immediately
            setActive(idx);

            // Set user priority lock
            userOverrideIdx = idx;
            userOverrideUntil = Date.now() + 900;

            // Seek and play
            const t = Math.min(target, (video.duration || target));
            video.currentTime = t;
            video.play().catch(err => {
                console.log('Autoplay prevented:', err);
            });
        };

        // Wait for metadata if not loaded
        if (video.readyState < 1) {
            pendingSeek = idx;
            video.addEventListener('loadedmetadata', () => {
                if (pendingSeek !== null) {
                    const i = pendingSeek;
                    pendingSeek = null;
                    doSeekTo(i);
                }
            }, { once: true });
        } else {
            seekTo();
        }
    }

    // Expose to window for HTML onclick
    window.seekOverviewVideo = function(timeOrIdx) {
        let idx;
        if (typeof timeOrIdx === 'number') {
            const i = seekTimes.indexOf(timeOrIdx);
            idx = (i >= 0) ? i : 0;
        } else {
            idx = 0;
        }
        doSeekTo(idx);
    };

    // Bind button click events
    btns.forEach((b, idx) => {
        if (!b) return;
        b.addEventListener('click', (e) => {
            e.preventDefault();
            doSeekTo(idx);
        });
    });

    // Auto-highlight based on video progress
    function updateStageBtn() {
        const now = Date.now();

        // Show user selection if locked
        if (userOverrideIdx !== null) {
            setActive(userOverrideIdx);

            // Release lock on timeout or if video enters that stage
            const autoIdx = getAutoStageIdx(video.currentTime);
            if (now >= userOverrideUntil || autoIdx === userOverrideIdx) {
                userOverrideIdx = null;
            }
            return;
        }

        // Auto-highlight based on current time
        setActive(getAutoStageIdx(video.currentTime));
    }

    video.addEventListener('timeupdate', updateStageBtn);
    video.addEventListener('seeking', updateStageBtn);
    video.addEventListener('seeked', updateStageBtn);

    // Auto-play is now handled by loading.js to ensure proper sequencing
    // This prevents video from playing during the loading animation
    // video.addEventListener('loadeddata', function delayedAutoPlay() {
    //     setTimeout(() => {
    //         video.play().catch(err => {
    //             console.log('Autoplay prevented by browser:', err);
    //         });
    //     }, 1500);
    //     video.removeEventListener('loadeddata', delayedAutoPlay);
    // }, { once: true });

    // Initialize
    updateStageBtn();
})();
