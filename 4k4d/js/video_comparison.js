// Written by Dor Verbin, October 2021
// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/

function playVids(id) {
    if (id.endsWith('After')) {
        id = id.slice(0, -5); // 'After' has 5 characters
    }
    leftVideo = document.getElementById(id);
    rightVideo = document.getElementById(id + 'After');
    videoMerge = document.getElementById(id + 'Merge');
    videoContainer = document.getElementById(id + 'Div');
    mergeContext = videoMerge.getContext('2d');

    if (
        leftVideo.readyState > HTMLMediaElement.HAVE_FUTURE_DATA &&
        rightVideo.readyState > HTMLMediaElement.HAVE_FUTURE_DATA
    ) {
        position = 0.5;
        vidWidth = $(leftVideo).parent().width();
        vidHeight = (leftVideo.videoHeight / leftVideo.videoWidth) * vidWidth;

        leftVideo.width = vidWidth;
        leftVideo.height = 0;
        rightVideo.width = vidWidth;
        rightVideo.height = 0;

        videoMerge.width = vidWidth;
        videoMerge.height = vidHeight;

        // videoContainer.style.width = videoMerge.width + 'px';
        // videoContainer.style.height = videoMerge.height + 'px';

        // console.log(videoContainer)

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = (e.pageX - bcr.x) / bcr.width;
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = (e.touches[0].pageX - bcr.x) / bcr.width;
        }

        videoMerge.addEventListener('mousemove', trackLocation, false);
        videoMerge.addEventListener('touchstart', trackLocationTouch, false);
        videoMerge.addEventListener('touchmove', trackLocationTouch, false);

        function drawLoop() {
            mergeContext.drawImage(
                leftVideo,
                0,
                0,
                vidWidth,
                vidHeight,
                0,
                0,
                vidWidth,
                vidHeight
            );
            var colStart = (vidWidth * position).clamp(0.0, vidWidth);
            var colWidth = (vidWidth - vidWidth * position).clamp(
                0.0,
                vidWidth
            );
            mergeContext.drawImage(
                rightVideo,
                colStart,
                0,
                colWidth,
                vidHeight,
                colStart,
                0,
                colWidth,
                vidHeight
            );
            videoMerge.animation_id = requestAnimationFrame(drawLoop);
            videoMerge.darwLoop = drawLoop;

            var arrowLength = 0.09 * vidHeight;
            var arrowheadWidth = 0.025 * vidHeight;
            var arrowheadLength = 0.04 * vidHeight;
            var arrowPosY = vidHeight / 10;
            var arrowWidth = 0.007 * vidHeight;
            var currX = vidWidth * position;

            // Draw circle
            mergeContext.arc(
                currX,
                arrowPosY,
                arrowLength * 0.7,
                0,
                Math.PI * 2,
                false
            );
            mergeContext.fillStyle = '#FFD79340';
            mergeContext.fill();
            //mergeContext.strokeStyle = "#444444";
            //mergeContext.stroke()

            // Draw border
            mergeContext.beginPath();
            mergeContext.moveTo(vidWidth * position, 0);
            mergeContext.lineTo(vidWidth * position, vidHeight);
            mergeContext.closePath();
            mergeContext.strokeStyle = '#AAAAAA';
            mergeContext.lineWidth = 5;
            mergeContext.stroke();

            // Draw arrow
            mergeContext.beginPath();
            mergeContext.moveTo(currX, arrowPosY - arrowWidth / 2);

            // Move right until meeting arrow head
            mergeContext.lineTo(
                currX + arrowLength / 2 - arrowheadLength / 2,
                arrowPosY - arrowWidth / 2
            );

            // Draw right arrow head
            mergeContext.lineTo(
                currX + arrowLength / 2 - arrowheadLength / 2,
                arrowPosY - arrowheadWidth / 2
            );
            mergeContext.lineTo(currX + arrowLength / 2, arrowPosY);
            mergeContext.lineTo(
                currX + arrowLength / 2 - arrowheadLength / 2,
                arrowPosY + arrowheadWidth / 2
            );
            mergeContext.lineTo(
                currX + arrowLength / 2 - arrowheadLength / 2,
                arrowPosY + arrowWidth / 2
            );

            // Go back to the left until meeting left arrow head
            mergeContext.lineTo(
                currX - arrowLength / 2 + arrowheadLength / 2,
                arrowPosY + arrowWidth / 2
            );

            // Draw left arrow head
            mergeContext.lineTo(
                currX - arrowLength / 2 + arrowheadLength / 2,
                arrowPosY + arrowheadWidth / 2
            );
            mergeContext.lineTo(currX - arrowLength / 2, arrowPosY);
            mergeContext.lineTo(
                currX - arrowLength / 2 + arrowheadLength / 2,
                arrowPosY - arrowheadWidth / 2
            );
            mergeContext.lineTo(
                currX - arrowLength / 2 + arrowheadLength / 2,
                arrowPosY
            );

            mergeContext.lineTo(
                currX - arrowLength / 2 + arrowheadLength / 2,
                arrowPosY - arrowWidth / 2
            );
            mergeContext.lineTo(currX, arrowPosY - arrowWidth / 2);

            mergeContext.closePath();

            mergeContext.fillStyle = '#AAAAAA';
            mergeContext.fill();
        }
        videoMerge.animation_id = requestAnimationFrame(drawLoop);
    }
}

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

function resizeAndPlay(video) {
    playVids(video.id);
}
