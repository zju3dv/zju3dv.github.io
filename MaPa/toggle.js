// 大视频的dom
let bigVideoList = [...document.querySelectorAll("#bigVideoList >video")];
// 小视频的dom
let videoList = [...document.querySelectorAll("#videoList >video")];
// 视频描述
let videoDesc = document.querySelector(".targetVideoDesc");
let videoDescList = [
  'original image',
  'texture with a maze-like style',
  'texture featuring the natural  curve of tree branches',
  'floral and ornate pattern'
]
console.log(videoDesc);
// 起始视频下标
let startIndex = 0;

videoList.forEach((video, index) => {
  // 添加点击事件
  video.addEventListener("click", (e) => {
    //   排他--大视频的切换效果
    for (let bigVideo of bigVideoList) {
      bigVideo.style.opacity = "0";
    }
    bigVideoList[index].style.opacity = "1";
    //   小视频的选中效果
    for (let smallVideo of videoList) {
      smallVideo.classList.remove("selectSmallVideo");
    }
    video.classList.add("selectSmallVideo");
    videoDesc.innerText = videoDescList[index]
    // 当点击指令视频的时候，记录当前下标
    setTimeout(() => {
      startIndex = index;
    }, 190);
  });
  // 播放完毕事件
  video.addEventListener("timeupdate", () => {
    var duration = video.duration; // 视频总时长
    var currentTime = video.currentTime; //当前所在的时间段
    if (index != startIndex) {
      return;
    }
    // 当距离结束还有0.2s的时候：设置进行下一个视频的点击
    if (currentTime >= duration - 0.2) {
      setTimeout(() => {
        // 在这里处理循环前的逻辑
        startIndex++;
        if (startIndex > 3) {
          startIndex = 0;
        }
        videoList[startIndex].click();
      }, 190);
    }
  });
});

window.addEventListener("DOMContentLoaded", () => {
  videoList[0].click();
});
