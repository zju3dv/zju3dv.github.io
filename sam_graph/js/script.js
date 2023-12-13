class BeforeAfter {
    constructor(enteryObject) {

        const beforeAfterContainer = document.querySelector(enteryObject.id);
        const before = beforeAfterContainer.querySelector('.bal-before');
        const beforeText = beforeAfterContainer.querySelector('.bal-beforePosition');
        const afterText = beforeAfterContainer.querySelector('.bal-afterPosition');
        const handle = beforeAfterContainer.querySelector('.bal-handle');
        var widthChange = 0;

        beforeAfterContainer.querySelector('.bal-before-inset').setAttribute("style", "width: " + beforeAfterContainer.offsetWidth + "px;")
        window.onresize = function () {
            beforeAfterContainer.querySelector('.bal-before-inset').setAttribute("style", "width: " + beforeAfterContainer.offsetWidth + "px;")
        }
        before.setAttribute('style', "width: 50%;");
        handle.setAttribute('style', "left: 50%;");

        //touch screen event listener
        beforeAfterContainer.addEventListener("touchstart", (e) => {

            beforeAfterContainer.addEventListener("touchmove", (e2) => {
                let containerWidth = beforeAfterContainer.offsetWidth;
                let currentPoint = e2.changedTouches[0].clientX;

                let startOfDiv = beforeAfterContainer.offsetLeft;

                let modifiedCurrentPoint = currentPoint - startOfDiv;

                if (modifiedCurrentPoint > 10 && modifiedCurrentPoint < beforeAfterContainer.offsetWidth - 10) {
                    let newWidth = modifiedCurrentPoint * 100 / containerWidth;

                    before.setAttribute('style', "width:" + newWidth + "%;");
                    afterText.setAttribute('style', "z-index: 1;");
                    handle.setAttribute('style', "left:" + newWidth + "%;");
                }
            });
        });

        //mouse move event listener
        beforeAfterContainer.addEventListener('mousemove', (e) => {
            let containerWidth = beforeAfterContainer.offsetWidth;
            widthChange = e.offsetX;
            let newWidth = widthChange * 100 / containerWidth;

            if (e.offsetX > 10 && e.offsetX < beforeAfterContainer.offsetWidth - 10) {
                before.setAttribute('style', "width:" + newWidth + "%;");
                afterText.setAttribute('style', "z-index:" + "1;");
                handle.setAttribute('style', "left:" + newWidth + "%;");
            }
        })

    }
}

function showExamples(exampleId1, exampleId2, tabElement) {
    var examples = document.getElementsByClassName('example');
    var tabs = document.getElementsByClassName('tab');
  
    // 隐藏所有的example容器
    for (var i = 0; i < examples.length; i++) {
      examples[i].style.display = 'none';
    }
  
    // 移除所有标签的active类
    for (var j = 0; j < tabs.length; j++) {
      tabs[j].classList.remove('active');
    }
  
    // 显示指定的example容器
    document.getElementById(exampleId1).style.display = 'block';
    document.getElementById(exampleId2).style.display = 'block';
  
    // 初始化或重新初始化BeforeAfter
    new BeforeAfter({ id: '#' + exampleId1 });
    new BeforeAfter({ id: '#' + exampleId2 });
  
    // 如果提供了tabElement，则为其添加active类
    if (tabElement) {
      tabElement.classList.add('active');
    }
  }
  
  // 当文档加载完成时，自动显示并激活Tab 2，并初始化BeforeAfter
  document.addEventListener('DOMContentLoaded', function() {
    var tab2 = document.querySelector('[data-tab-for="example3,example4"]');
    showExamples('example3', 'example4', tab2);
  });
  
  