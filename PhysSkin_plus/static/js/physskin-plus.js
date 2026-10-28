document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const navbar = document.getElementById("project-navbar");
  const moreMenu = document.querySelector(".project-nav-more");
  const moreButton = document.querySelector(".project-nav-more-button");

  const updateNavbar = () => {
    navbar?.classList.toggle("is-floating", window.scrollY > 24);
  };

  updateNavbar();
  window.addEventListener("scroll", updateNavbar, { passive: true });

  moreButton?.addEventListener("click", () => {
    const isOpen = moreMenu?.classList.toggle("is-open") ?? false;
    moreButton.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (moreMenu && !moreMenu.contains(event.target)) {
      moreMenu.classList.remove("is-open");
      moreButton?.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll("[data-video-carousel]").forEach((carousel) => {
    const videos = Array.from(carousel.querySelectorAll(".carousel-video"));
    const count = carousel.querySelector(".carousel-count");
    const viewport = carousel.querySelector(".video-carousel");
    const previousButton = carousel.querySelector(".carousel-button-prev");
    const nextButton = carousel.querySelector(".carousel-button-next");
    let activeIndex = 0;
    let isSwitching = false;

    const updateButtons = () => {
      if (previousButton) {
        previousButton.disabled = isSwitching || activeIndex === 0;
      }
      if (nextButton) {
        nextButton.disabled = isSwitching || activeIndex === videos.length - 1;
      }
    };

    const showVideo = (nextIndex) => {
      if (isSwitching || nextIndex < 0 || nextIndex >= videos.length) {
        return;
      }

      const swapVideo = () => {
        videos[activeIndex].pause();
        videos[activeIndex].classList.remove("is-active");
        activeIndex = nextIndex;
        videos[activeIndex].classList.add("is-active");
        videos[activeIndex].currentTime = 0;
        videos[activeIndex].play().catch(() => {});
        if (count) {
          count.textContent = `${activeIndex + 1} / ${videos.length}`;
        }
      };

      if (prefersReducedMotion || !viewport) {
        swapVideo();
        updateButtons();
        return;
      }

      isSwitching = true;
      updateButtons();
      viewport.classList.add("is-switching");
      window.setTimeout(() => {
        swapVideo();
        requestAnimationFrame(() => {
          viewport.classList.remove("is-switching");
          window.setTimeout(() => {
            isSwitching = false;
            updateButtons();
          }, 180);
        });
      }, 180);
    };

    previousButton?.addEventListener("click", () => showVideo(activeIndex - 1));
    nextButton?.addEventListener("click", () => showVideo(activeIndex + 1));
    updateButtons();
  });

  document.querySelectorAll("[data-video-pair-carousel]").forEach((carousel) => {
    const videos = Array.from(carousel.querySelectorAll(".pair-carousel-video"));
    const count = carousel.querySelector(".carousel-count");
    const viewport = carousel.querySelector(".video-carousel");
    const previousButton = carousel.querySelector(".carousel-button-prev");
    const nextButton = carousel.querySelector(".carousel-button-next");
    let activeIndex = 0;
    let isSwitching = false;

    const updateButtons = () => {
      if (previousButton) {
        previousButton.disabled = isSwitching || activeIndex === 0;
      }
      if (nextButton) {
        nextButton.disabled = isSwitching || activeIndex === videos.length - 2;
      }
    };

    const showVideos = (nextIndex) => {
      if (isSwitching || nextIndex < 0 || nextIndex > videos.length - 2) {
        return;
      }

      const swapVideos = () => {
        videos.forEach((video) => {
          video.pause();
          video.classList.remove("is-active");
        });
        activeIndex = nextIndex;
        const visibleIndices = [activeIndex, activeIndex + 1];
        visibleIndices.forEach((index) => {
          const video = videos[index];
          video.classList.add("is-active");
          video.currentTime = 0;
          video.play().catch(() => {});
        });
        if (count) {
          count.textContent = `${activeIndex + 1}–${activeIndex + 2} / ${videos.length}`;
        }
      };

      if (prefersReducedMotion || !viewport) {
        swapVideos();
        updateButtons();
        return;
      }

      isSwitching = true;
      updateButtons();
      viewport.classList.add("is-switching");
      window.setTimeout(() => {
        swapVideos();
        requestAnimationFrame(() => {
          viewport.classList.remove("is-switching");
          window.setTimeout(() => {
            isSwitching = false;
            updateButtons();
          }, 180);
        });
      }, 180);
    };

    previousButton?.addEventListener("click", () => showVideos(activeIndex - 1));
    nextButton?.addEventListener("click", () => showVideos(activeIndex + 1));
    updateButtons();
  });

  document.querySelectorAll("[data-video-strip]").forEach((strip) => {
    const track = strip.querySelector(".rig-video-track");
    const previousButton = strip.querySelector(".rig-strip-button-prev");
    const nextButton = strip.querySelector(".rig-strip-button-next");

    const scrollByCard = (direction) => {
      const card = track?.querySelector(".rig-video-tile");
      if (!track || !card) {
        return;
      }
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 16;
      track.scrollBy({
        left: direction * (card.getBoundingClientRect().width + gap),
        behavior: "smooth",
      });
    };

    previousButton?.addEventListener("click", () => scrollByCard(-1));
    nextButton?.addEventListener("click", () => scrollByCard(1));
  });
});
