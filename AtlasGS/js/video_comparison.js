// Written by Dor Verbin, October 2021
// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/

function playVids(videoId) {
    var videoMerge = document.getElementById(videoId + "Merge");
    var vid = document.getElementById(videoId);

    var positionX = 0.5;
    var positionY = 0.5
    var vidWidth = vid.videoWidth/2;
    var vidHeight = vid.videoHeight/2;

    var mergeContext = videoMerge.getContext("2d");

    
    if (vid.readyState > 3) {
        vid.play();

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            positionX = ((e.pageX - bcr.x) / bcr.width);
            // positionY = 1 - ((e.pageY- bcr.y) / bcr.height);
            positionY = ((e.y - bcr.y) / bcr.height);
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            positionX = ((e.touches[0].pageX - bcr.x) / bcr.width);
            positionY = ((e.touches[0].pageY - bcr.y) / bcr.height);
        }

        videoMerge.addEventListener("mousemove",  trackLocation, false); 
        videoMerge.addEventListener("touchstart", trackLocationTouch, false);
        videoMerge.addEventListener("touchmove",  trackLocationTouch, false);


        function drawLoop() {
            var colStart = (vidWidth * positionX).clamp(0.0, vidWidth);
            var colWidth = (vidWidth - (vidWidth * positionX)).clamp(0.0, vidWidth);
            var rowStart = (vidHeight * positionY).clamp(0.0, vidHeight);
            var rowHeight = (vidHeight - (vidHeight * positionY)).clamp(0.0, vidHeight);

            mergeContext.drawImage(vid, 0, 0, vidWidth, vidHeight, 0, 0, vidWidth, vidHeight);
            mergeContext.drawImage(vid, colStart+vidWidth, 0, colWidth, vidHeight, colStart, 0, colWidth, vidHeight);

            mergeContext.drawImage(vid, 0, rowStart+vidHeight, vidWidth, rowHeight, 0, rowStart, vidWidth, rowHeight);
            mergeContext.drawImage(vid, colStart+vidWidth, rowStart+vidHeight, colWidth, rowHeight, colStart, rowStart, colWidth, rowHeight);
       
            requestAnimationFrame(drawLoop);

            
            var arrowLength = 0.09 * vidHeight;
            var arrowheadWidth = 0.025 * vidHeight;
            var arrowheadLength = 0.04 * vidHeight;
            // var arrowPosY = vidHeight / 10;
            var arrowWidth = 0.007 * vidHeight;
            var currX = vidWidth * positionX;
            var currY = vidHeight * positionY;

            // Draw circle
            mergeContext.arc(currX, currY, arrowLength*0.7, 0, Math.PI * 2, false);
            mergeContext.fillStyle = "#FFD79340";
            mergeContext.fill()
            //mergeContext.strokeStyle = "#444444";
            //mergeContext.stroke()
            
            // Draw border
            mergeContext.beginPath();
            mergeContext.moveTo(vidWidth*positionX, 0);
            mergeContext.lineTo(vidWidth*positionX, vidHeight);
            mergeContext.closePath()
            mergeContext.strokeStyle = "#444444";
            mergeContext.lineWidth = 5;            
            mergeContext.stroke();

            mergeContext.beginPath();
            mergeContext.moveTo(0, vidHeight*positionY);
            mergeContext.lineTo(vidWidth, vidHeight * positionY);
            mergeContext.closePath()

            mergeContext.strokeStyle = "#444444";
            mergeContext.lineWidth = 5;            
            mergeContext.stroke();

            // Draw arrow (horizontal)
            mergeContext.beginPath();
            mergeContext.moveTo(currX, currY - arrowWidth/2);
            
            // Move right until meeting arrow head
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, currY - arrowWidth/2);
            
            // Draw right arrow head
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, currY - arrowheadWidth/2);
            mergeContext.lineTo(currX + arrowLength/2, currY);
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, currY + arrowheadWidth/2);
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, currY + arrowWidth/2);

            // Go back to the left until meeting left arrow head
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, currY + arrowWidth/2);
            
            // Draw left arrow head
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, currY + arrowheadWidth/2);
            mergeContext.lineTo(currX - arrowLength/2, currY);
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, currY  - arrowheadWidth/2);
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, currY);
            
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, currY - arrowWidth/2);
            mergeContext.lineTo(currX, currY - arrowWidth/2);

            mergeContext.closePath();

            mergeContext.fillStyle = "#444444";
            mergeContext.fill();

            // Draw arrow (vertical)
            mergeContext.beginPath();
            mergeContext.moveTo(currX - arrowWidth/2, currY);

            // Move down until meeting bottom arrow head
            mergeContext.lineTo(currX - arrowWidth/2, currY + arrowLength/2 - arrowheadLength/2);

            // Draw bottom arrow head
            mergeContext.lineTo(currX - arrowheadWidth/2, currY + arrowLength/2 - arrowheadLength/2);
            mergeContext.lineTo(currX, currY + arrowLength/2);
            mergeContext.lineTo(currX + arrowheadWidth/2, currY + arrowLength/2 - arrowheadLength/2);
            mergeContext.lineTo(currX + arrowWidth/2, currY + arrowLength/2 - arrowheadLength/2);

            // Go back up until meeting top arrow head
            mergeContext.lineTo(currX + arrowWidth/2, currY - arrowLength/2 + arrowheadLength/2);

            // Draw top arrow head
            mergeContext.lineTo(currX + arrowheadWidth/2, currY - arrowLength/2 + arrowheadLength/2);
            mergeContext.lineTo(currX, currY - arrowLength/2);
            mergeContext.lineTo(currX - arrowheadWidth/2, currY - arrowLength/2 + arrowheadLength/2);
            mergeContext.lineTo(currX - arrowWidth/2, currY - arrowLength/2 + arrowheadLength/2);

            mergeContext.lineTo(currX - arrowWidth/2, currY);
            mergeContext.closePath();

            mergeContext.fillStyle = "#444444";
            mergeContext.fill();
        }
        requestAnimationFrame(drawLoop);
    } 
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};
    
    
function resizeAndPlay(element)
{
  var cv = document.getElementById(element.id + "Merge");
  cv.width = element.videoWidth/2;
  cv.height = element.videoHeight/2;
  element.play();
  element.style.height = "0px";  // Hide video without stopping it
    
  playVids(element.id);
}