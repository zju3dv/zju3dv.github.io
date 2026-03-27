var current_3D_SceneList = ['0001', '0002', '0003', '0004', '0005']
var current_3D_Scene = "0001";
var current_3D_SceneId = 0;

function Change_TOI_scene(idx) {

  var li_list = document.querySelectorAll("#toi-buttons .button");

  for (let i = 0; i < li_list.length; i++) {
    li_list[i].classList.remove('is-primary');
    li_list[i].classList.remove('is-primary-purple');
  }

  if (idx < 3) {
    li_list[idx].classList.add('is-primary');
  } else {
    li_list[idx].classList.add('is-primary-purple');
  }

  current_3D_Scene = current_3D_SceneList[idx];
  current_3D_SceneId = idx;
  let video = document.getElementById("toi-video");
  var baseSrc = video.getAttribute("src") || video.getAttribute("data-src");
  if (!baseSrc) {
    return;
  }
  var new_scr = baseSrc.split('/');
  new_scr[new_scr.length - 1] = current_3D_Scene + ".mp4";
  var new_video_dir = new_scr.join('/');
  video.setAttribute("src", new_video_dir);
  video.setAttribute("data-src", new_video_dir);
  video.load();
}

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
