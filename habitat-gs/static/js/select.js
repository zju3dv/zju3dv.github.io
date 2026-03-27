var current_3D_SceneList = ['0001', '0002', '0003', '0004', '0005']
var toiScenes = [
  { id: '0001', label: 'Karaoke bar', source: 'InteriorGS' },
  { id: '0002', label: 'Science museum', source: 'InteriorGS' },
  { id: '0003', label: 'Apartment', source: 'InteriorGS' },
  { id: '0004', label: 'Japanese garden', source: 'Marble' },
  { id: '0005', label: 'Modern villa', source: 'Marble' }
];
var current_3D_Scene = "0001";
var current_3D_SceneId = 0;

function Change_TOI_scene(idx) {
  var scene = toiScenes[idx];
  if (!scene) {
    return;
  }

  var li_list = document.querySelectorAll("#toi-buttons .button");

  for (let i = 0; i < li_list.length; i++) {
    li_list[i].classList.remove('is-primary');
    li_list[i].classList.remove('is-primary-purple');
  }

  if (scene.source === 'InteriorGS') {
    li_list[idx].classList.add('is-primary');
  } else {
    li_list[idx].classList.add('is-primary-purple');
  }

  current_3D_Scene = scene.id;
  current_3D_SceneId = idx;
  let video = document.getElementById("toi-video");
  let shell = document.getElementById("toi-video-shell");
  let status = document.getElementById("toi-video-status");
  if (!video) {
    return;
  }

  var baseSrc = video.getAttribute("src") || video.getAttribute("data-src");
  if (!baseSrc) {
    return;
  }
  var new_scr = baseSrc.split('/');
  new_scr[new_scr.length - 1] = current_3D_Scene + ".mp4";
  var new_video_dir = new_scr.join('/');

  if (status) {
    status.textContent = "Loading " + scene.source + " scene: " + scene.label + "...";
  }
  if (shell) {
    shell.classList.add('is-loading');
  }

  if (video._toiReadyHandler) {
    video.removeEventListener('loadeddata', video._toiReadyHandler);
    video.removeEventListener('canplay', video._toiReadyHandler);
  }
  if (video._toiErrorHandler) {
    video.removeEventListener('error', video._toiErrorHandler);
  }

  var handleReady = function() {
    if (shell) {
      shell.classList.remove('is-loading');
    }
    video.removeEventListener('loadeddata', handleReady);
    video.removeEventListener('canplay', handleReady);
    video.removeEventListener('error', handleError);
    video.play().catch(function() {});
  };

  var handleError = function() {
    if (status) {
      status.textContent = "Unable to load " + scene.label + " right now.";
    }
    video.removeEventListener('loadeddata', handleReady);
    video.removeEventListener('canplay', handleReady);
    video.removeEventListener('error', handleError);
  };

  video._toiReadyHandler = handleReady;
  video._toiErrorHandler = handleError;
  video.addEventListener('loadeddata', handleReady);
  video.addEventListener('canplay', handleReady);
  video.addEventListener('error', handleError);
  video.setAttribute("src", new_video_dir);
  video.setAttribute("data-src", new_video_dir);
  video.load();
}

document.addEventListener("DOMContentLoaded", function() {
  var video = document.getElementById("toi-video");
  var shell = document.getElementById("toi-video-shell");

  if (!video || !shell) {
    return;
  }

  var clearInitialLoading = function() {
    shell.classList.remove('is-loading');
    video.removeEventListener('loadeddata', clearInitialLoading);
    video.removeEventListener('canplay', clearInitialLoading);
  };

  video.addEventListener('loadeddata', clearInitialLoading);
  video.addEventListener('canplay', clearInitialLoading);
});

function Change_comp_scene(idx) {

  var li_list = document.querySelector("#comp-buttons").children;

  // console.log(idx);
  console.log(li_list);
  for (i = 0; i < li_list.length; i++) {
    li_list[i].classList = ['button']
  }
  li_list[idx].classList.add('is-primary');

  current_3D_Scene = current_3D_SceneList[idx];
  current_3D_SceneId = idx;
  let videos = document.querySelectorAll(".comp-videos");
  for (let video of videos) {
    old_src = video.src;
    new_scr = old_src.split('/');
    method = new_scr[new_scr.length - 1].split('_')[1];
    new_scr[new_scr.length - 1] = current_3D_Scene + '_' + method;
    new_video_dir = new_scr.join('/');
    video.src = new_video_dir;
    video.load()
  }
}
