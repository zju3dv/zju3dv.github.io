window.HELP_IMPROVE_VIDEOJS = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

$(document).ready(function () {
  // Check for click events on the navbar burger icon
  $(".navbar-burger").click(function () {
    // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");

  });

  var options = {
    slidesToScroll: 1,
    slidesToShow: 3,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  }

  // Initialize all div with carousel class
  var carousels = bulmaCarousel.attach('.carousel', options);

  // Loop on each carousel initialized
  for (var i = 0; i < carousels.length; i++) {
    // Add listener to  event
    carousels[i].on('before:show', state => {
      console.log(state);
    });
  }

  // Access to bulmaCarousel instance of an element
  var element = document.querySelector('#my-element');
  if (element && element.bulmaCarousel) {
    // bulmaCarousel instance is available as element.bulmaCarousel
    element.bulmaCarousel.on('before-show', function (state) {
      console.log(state);
    });
  }

  bulmaSlider.attach();


  $('.zoom-container').each(function() {
    const containerElement = $(this);
    zoomWidget = new ZoomWidget(containerElement);
  });

  $('.video-comparison').each(function () {
      const containerElement = $(this);
      comparisonWidget = new VideoComparison(containerElement);
  });

  $('.tabs-widget').each(function() {
    const containerElement = $(this);
    tabsWidget = new TabsWidget(containerElement);
  });

  //playPauseVideo();
});


class ZoomWidget {
  constructor(container) {
    this.container = container;
    this.canvas = container.find('canvas');
    this.context = this.canvas[0].getContext("2d");
    this.image = new Image();
    this.image.src = this.container.data('gt-img-src');
    this.zoomFactor = container.data('zoom-factor');
    this.defaultU = this.container.data('default-u');
    this.defaultV = this.container.data('default-v');
    let self = this;

    this.image.onload = function(){
      self.handleZoom(null, null, self.defaultU, self.defaultV);
    }

    this.canvas.mousemove(function(e) {
      let rect = self.canvas[0].getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      self.handleZoom(x, y);
    });
    this.canvas.on('resize', function(e) {
      self.handleZoom(null, null, self.defaultU, self.defaultV);
    })
    this.canvas.mouseleave(function(e) {
      self.handleZoom(null, null, self.defaultU, self.defaultV);
    });
  }

  handleZoom(x = null, y = null, u = null, v = null) {
    const containerElement = this.container;
    const zoomLensElements = containerElement.find('.zoom-lens');
    this.context.clearRect(0, 0, this.canvas[0].width, this.canvas[0].height);

    const imageWidth = this.canvas.parent().width();
    const imageHeight = imageWidth / this.image.width * this.image.height;
    this.canvas[0].width = imageWidth;
    this.canvas[0].height = imageHeight;
    this.context.drawImage(this.image, 0, 0, imageWidth, imageHeight);
  
    if (u && v) {
      x = u * this.canvas.width();
      y = v * this.canvas.height();
    } else {
      u = x / this.canvas.width()
      v = y / this.canvas.height()
    }
    console.log('u v', u, v)
    let naturalHeight = this.image.naturalHeight;
    let naturalWidth = this.image.naturalWidth;
    let zoomFullWidth = naturalWidth * this.zoomFactor;
    let zoomFullHeight = naturalHeight * this.zoomFactor;
  
    zoomLensElements.each(function () {
      let el = $(this);
      let zoomWindowWidth = el.width();
      let zoomWindowHeight = el.height();
      let maxZoomX = zoomFullWidth - zoomWindowWidth - 1;
      let maxZoomY = zoomFullHeight - zoomWindowHeight - 1;
      let zoomX = clamp(zoomFullWidth * u - zoomWindowWidth / 2, 0, maxZoomX);
      let zoomY = clamp(zoomFullHeight * v - zoomWindowHeight / 2, 0, maxZoomY);
  
      el.css('background-size',
        zoomFullWidth + 'px ' + zoomFullHeight + 'px');
      el.css('background-position',
        (-zoomX) + 'px ' + (-zoomY) + 'px');
    })
  
    let zoomWindowWidth = $(zoomLensElements[0]).width();
    let zoomWindowHeight = $(zoomLensElements[0]).height();
    let zoomCursorWidth = zoomWindowWidth / zoomFullWidth * this.canvas.width();
    let zoomCursorHeight = zoomWindowHeight / zoomFullHeight * this.canvas.height();
    this.context.strokeStyle = '#DB4437';
    this.context.lineWidth = 2;
    this.context.strokeRect(
      x - zoomCursorWidth / 2, y - zoomCursorHeight / 2, zoomCursorWidth, zoomCursorHeight);
  }
}


class TabsWidget {
  constructor(container) {
    this.container = container;
    this.activeIndex = 0;
    this.listItems = container.children('.tabs').children('ul').children('li');
    let self = this;
    this.listItems.click(function (e) {
      let index = $(this).index();
      self.update($(this), index);
    })

    this.update(this.listItems[this.activeIndex], this.activeIndex);
  }

  update(element, targetIndex) {
    this.activeIndex = targetIndex;
    const tabs = this.container.children('.tabs');
    const tabsContent = this.container.children('.tabs-content');
    this.listItems.each(function () {
      if ($(this).index() == targetIndex) {
        $(this).addClass('is-active');
      } else {
        $(this).removeClass('is-active');
      }
    });
    tabsContent.children().each(function () {
      if ($(this).index() == targetIndex) {
        $(this).show();
        $(this).find('*').each(function () {
          if ($(this).is(':visible')) {
            $(this).trigger('tab:show');
          }
        })
      } else {
        $(this).hide();
        $(this).find('*').trigger('tab:hide');
      }
    });
  }
}

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}


// From: https://benfrain.com/automatically-play-and-pause-video-as-it-enters-and-leaves-the-viewport-screen/
function playPauseVideo() {
  let videos = document.querySelectorAll("video");
  videos.forEach((video) => {
      // We can only control playback without insteraction if video is mute
      video.muted = true;
      // Play is a promise so we need to check we have it
      let playPromise = video.play();
      if (playPromise !== undefined) {
          playPromise.then((_) => {
              let observer = new IntersectionObserver(
                  (entries) => {
                      entries.forEach((entry) => {
                          if (
                              entry.intersectionRatio !== 1 &&
                              !video.paused
                          ) {
                              video.pause();
                          } else if (video.paused) {
                              video.play();
                          }
                      });
                  },
                  { threshold: 0.5 }
              );
              observer.observe(video);
          });
      }
  });
}