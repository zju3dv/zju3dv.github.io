document.addEventListener('DOMContentLoaded', domReady);

        function domReady() {
            new Dics({
                container: document.querySelectorAll('.b-dics')[0]
            });

            new Dics({
                container: document.querySelectorAll('.b-dics')[1],
                hideTexts: false,
                textPosition: "top"
            });

            new Dics({
                container: document.querySelectorAll('.b-dics')[2],
                hideTexts: false,
                textPosition: "top"
            });

            new Dics({
                container: document.querySelectorAll('.b-dics')[3],
                hideTexts: false,
                textPosition: "top"
            });

            new Dics({
                container: document.querySelectorAll('.b-dics')[4],
                hideTexts: false,
                textPosition: "top"
            });
        }

        function dnerfPredEvent(idx) {
            let dics = document.querySelectorAll('.b-dics')[0]
            let sections = dics.getElementsByClassName('b-dics__section')
            let imagesLength = 3
            for (let i = 0; i < imagesLength; i++) {
                let image = sections[i].getElementsByClassName('b-dics__image-container')[0].getElementsByClassName('b-dics__image')[0]
                switch (idx) {
                    case 0:
                        image.src = 'assets/video/dnerf/bouncingballs/';
                        break;
                    case 1:
                        image.src = 'assets/video/dnerf/trex/';
                        break;
                    case 2:
                        image.src = 'assets/video/dnerf/hellwarrior/';
                        break;
                    case 3:
                        image.src = 'assets/video/dnerf/jumpingjacks/';
                        break;
                    // case 4:
                    //     image.src = 'assets/video/dnerf/Courthouse/';
                    //     break;
                    // case 5:
                    //     image.src = 'assets/video/dnerf/Ignatius/';
                    //     break;
                    // case 6:
                    //     image.src = 'assets/video/dnerf/Meetingroom/';
                    //     break;
                    // case 7:
                    //     image.src = 'assets/video/dnerf/Truck/';
                    //     break;
                }
                switch (i) {
                    case 0:
                        image.src = image.src + '/deform.gif';
                        break;
                    case 1:
                        image.src = image.src + '/ours.gif';
                        break;
                    case 2:
                        image.src = image.src + '/Tineuvox.gif';
                        break;
                }
            }

            scene_list = document.getElementById("dnerf_prediction").children;
            for (let i = 0; i < scene_list.length; i++) {
                if (idx == i) {
                    scene_list[i].children[0].className = "nav-link active"
                }
                else {
                    scene_list[i].children[0].className = "nav-link"
                }
            }
            scene_list = document.getElementById("large-scale-recon-2").children;
            for (let i = 0; i < scene_list.length; i++) {
                if (idx == i+2) {
                    scene_list[i].children[0].className = "nav-link active"
                }
                else {
                    scene_list[i].children[0].className = "nav-link"
                }
            }
        }

        function objectSceneEvent(idx) {
            let dics = document.querySelectorAll('.b-dics')[1]
            let sections = dics.getElementsByClassName('b-dics__section')
            let imagesLength = 3
            for (let i = 0; i < imagesLength; i++) {
                let image = sections[i].getElementsByClassName('b-dics__image-container')[0].getElementsByClassName('b-dics__image')[0]
                switch (idx) {
                    case 0:
                        image.src = 'assets/video/dnerf/dtu24/';
                        break;
                    case 1:
                        image.src = 'assets/video/dnerf/dtu37/';
                        break;
                    case 2:
                        image.src = 'assets/video/dnerf/dtu40/';
                        break;
                    case 3:
                        image.src = 'assets/video/dnerf/dtu63/';
                        break;
                }
                switch (i) {
                    case 0:
                        image.src = image.src + '/neus.png';
                        break;
                    case 1:
                        image.src = image.src + '/ours.png';
                        break;
                    case 2:
                        image.src = image.src + '/neuralwarp.png';
                        break;
                }
            }

            let scene_list = document.getElementById("object-scale-recon").children;
            for (let i = 0; i < scene_list.length; i++) {
                if (idx == i) {
                    scene_list[i].children[0].className = "nav-link active"
                }
                else {
                    scene_list[i].children[0].className = "nav-link"
                }
            }
        }