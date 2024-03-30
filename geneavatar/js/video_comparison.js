// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/

function playVids(videoId) {
    var videoMerge = document.getElementById(videoId + "Merge");
    var vid = document.getElementById(videoId);

    var position = 0.5;
    var vidWidth = vid.videoWidth / 2;
    var vidHeight = vid.videoHeight;

    var mergeContext = videoMerge.getContext("2d");


    if (vid.readyState > 3) {
        vid.play();

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.pageX - bcr.x - window.scrollX) / bcr.width);
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.touches[0].pageX - bcr.x - window.scrollX) / bcr.width);
        }

        videoMerge.addEventListener("mousemove", trackLocation, false);
        videoMerge.addEventListener("touchstart", trackLocationTouch, false);
        videoMerge.addEventListener("touchmove", trackLocationTouch, false);


        function drawLoop() {
            var colStart = (vidWidth * position).clamp(0.0, vidWidth);
            var colWidth = (vidWidth - (vidWidth * position)).clamp(0.0, vidWidth);
            mergeContext.drawImage(vid, 0, 0, vidWidth, vidHeight, 0, 0, vidWidth, vidHeight);
            mergeContext.drawImage(vid, colStart + vidWidth, 0, colWidth, vidHeight, colStart, 0, colWidth, vidHeight);

            var arrowLength = 0.09 * vidHeight;
            var arrowheadWidth = 0.025 * vidHeight;
            var arrowheadLength = 0.04 * vidHeight;
            var arrowPosY = vidHeight / 2;
            var arrowWidth = 0.007 * vidHeight;
            var currX = vidWidth * position;

            // Draw circle
            mergeContext.arc(currX, arrowPosY, arrowLength * 0.7, 0, Math.PI * 2, false);
            mergeContext.fillStyle = "#FFD79340";
            mergeContext.fill()
            //mergeContext.strokeStyle = "#444444";
            //mergeContext.stroke()

            // Draw border
            mergeContext.beginPath();
            mergeContext.moveTo(vidWidth * position, 0);
            mergeContext.lineTo(vidWidth * position, vidHeight);
            mergeContext.closePath()
            mergeContext.strokeStyle = "#44444440";
            mergeContext.lineWidth = 5;
            mergeContext.stroke();

            // Draw arrow
            mergeContext.beginPath();
            mergeContext.moveTo(currX, arrowPosY - arrowWidth / 2);

            mergeContext.strokeStyle = "#44444440";
            // Move right until meeting arrow head
            mergeContext.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY - arrowWidth / 2);

            // Draw right arrow head
            mergeContext.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY - arrowheadWidth / 2);
            mergeContext.lineTo(currX + arrowLength / 2, arrowPosY);
            mergeContext.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY + arrowheadWidth / 2);
            mergeContext.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY + arrowWidth / 2);

            // Go back to the left until meeting left arrow head
            mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY + arrowWidth / 2);

            // Draw left arrow head
            mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY + arrowheadWidth / 2);
            mergeContext.lineTo(currX - arrowLength / 2, arrowPosY);
            mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY - arrowheadWidth / 2);
            mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY);

            mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY - arrowWidth / 2);
            mergeContext.lineTo(currX, arrowPosY - arrowWidth / 2);

            mergeContext.closePath();

            mergeContext.fillStyle = "#44444440";
            mergeContext.fill();

            // requestAnimationFrame(drawLoop);
        }
        // requestAnimationFrame(drawLoop);

        function test_vis(){
            var bcr = videoMerge.getBoundingClientRect();
            var x = bcr.left, y = bcr.top, w = videoMerge.offsetWidth, h = videoMerge.offsetHeight, 
            r = x + w, //right
            b = y + h, //bottom
            visibleX, visibleY, visible;
            visibleX = Math.max(0, Math.min(w, window.innerWidth - x, r));
            visibleY = Math.max(0, Math.min(h, window.innerHeight - y, b));
            visible = visibleX * visibleY / (w * h);
            if(visible > 0.5){
                requestAnimationFrame(drawLoop);
            }
            requestAnimationFrame(test_vis)
        }
        requestAnimationFrame(test_vis)
    }
}

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};


function resizeAndPlay(element) {
    var cv = document.getElementById(element.id + "Merge");
    cv.width = element.videoWidth / 2;
    cv.height = element.videoHeight;
    element.play();
    element.style.height = "0px";  // Hide video without stopping it

    playVids(element.id);
}

function playVids_4(videoId) {
    var videoMerge = document.getElementById(videoId + "Merge");
    var vid = document.getElementById(videoId);

    var position_x = 0.5;
    var position_y = 0.5;
    var vidWidth = vid.videoWidth / 2;
    var vidHeight = vid.videoHeight / 2;

    var mergeContext = videoMerge.getContext("2d");
    
    if (vid.readyState > 3) {
        vid.play();

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position_x = ((e.pageX - bcr.x - window.scrollX) / bcr.width);
            position_y = ((e.pageY - bcr.y - window.scrollY) / bcr.height);
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position_x = ((e.touches[0].pageX - bcr.x - window.scrollX) / bcr.width);
            position_y = ((e.touches[0].pageY - bcr.y - window.scrollY) / bcr.height);
        }

        videoMerge.addEventListener("mousemove", trackLocation, false);
        videoMerge.addEventListener("touchstart", trackLocationTouch, false);
        videoMerge.addEventListener("touchmove", trackLocationTouch, false);

        function drawLoop() {
            var colStart = (vidWidth * position_x).clamp(0.0, vidWidth); // start from
            var colWidth = (vidWidth - (vidWidth * position_x)).clamp(0.0, vidWidth); // remaining
            var rowStart = (vidHeight * position_y).clamp(0.0, vidHeight); // start from
            var rowWidth = (vidHeight - (vidHeight * position_y)).clamp(0.0, vidHeight); // remaining
            mergeContext.drawImage(vid, 0, 0, colStart, rowStart, 0, 0, colStart, rowStart);
            mergeContext.drawImage(vid, colStart + vidWidth, 0, colWidth, rowStart, colStart, 0, colWidth, rowStart);
            mergeContext.drawImage(vid, 0, rowStart + vidHeight, colStart, rowWidth, 0, rowStart, colStart, rowWidth);
            mergeContext.drawImage(vid, colStart + vidWidth, rowStart + vidHeight, colWidth, rowWidth, colStart, rowStart, colWidth, rowWidth);
                        
            var arrowLength = 0.03 * vidHeight;
            var currX = vidWidth * position_x;
            var currY = vidHeight * position_y;

            // Draw circle
            mergeContext.arc(currX, currY, arrowLength * 0.7, 0, Math.PI * 2, false);
            mergeContext.fillStyle = "#44444450";
            mergeContext.fill()
            //mergeContext.strokeStyle = "#444444";
            //mergeContext.stroke()

            // Draw border
            mergeContext.beginPath();
            mergeContext.moveTo(vidWidth * position_x, 0);
            mergeContext.lineTo(vidWidth * position_x, vidHeight);
            mergeContext.closePath()
            mergeContext.strokeStyle = "#44444450";
            mergeContext.lineWidth = 3;
            mergeContext.stroke();

            mergeContext.beginPath();
            mergeContext.moveTo(0, vidHeight * position_y);
            mergeContext.lineTo(vidWidth, vidHeight * position_y);
            mergeContext.closePath()
            mergeContext.strokeStyle = "#44444450";
            mergeContext.lineWidth = 3;
            mergeContext.stroke();

            mergeContext.closePath();

            mergeContext.fillStyle = "#44444450";
            mergeContext.fill();
            // requestAnimationFrame(drawLoop);
        }
        // requestAnimationFrame(drawLoop);
        
        function test_vis(){
            var bcr = videoMerge.getBoundingClientRect();
            var x = bcr.left, y = bcr.top, w = videoMerge.offsetWidth, h = videoMerge.offsetHeight, 
            r = x + w, //right
            b = y + h, //bottom
            visibleX, visibleY, visible;
            visibleX = Math.max(0, Math.min(w, window.innerWidth - x, r));
            visibleY = Math.max(0, Math.min(h, window.innerHeight - y, b));
            visible = visibleX * visibleY / (w * h);
            if(visible > 0.5){
                requestAnimationFrame(drawLoop);
            }
            requestAnimationFrame(test_vis)
        }
        requestAnimationFrame(test_vis)
    }
}


function resizeAndPlay_4(element) {
    var cv = document.getElementById(element.id + "Merge");
    cv.width = element.videoWidth / 2;
    cv.height = element.videoHeight / 2;
    element.play();
    element.style.height = "0px";  // Hide video without stopping it

    playVids_4(element.id);
}
