document.addEventListener('DOMContentLoaded', domReady);

function domReady() {
    new Dics({
        container: document.querySelectorAll('.b-dics')[0],
        hideTexts: false,
        textPosition: "bottom"
    });
    new Dics({
        container: document.querySelectorAll('.b-dics')[1],
        hideTexts: false,
        textPosition: "bottom"
    });
}



function objectSceneEvent(idx) {
    let dics = document.querySelectorAll('.b-dics')[0];
    let sections = dics.getElementsByClassName('b-dics__section');
    let imagesLength = 5; // TODO

    updateImages(sections, idx, imagesLength, 'object');
    updateMesh(idx, 'object');
    // updateTabStates('object-scale-recon', idx);
}

function updateMesh(idx, sliderType) {
    let meshFolder   = getImageFolder(idx, sliderType);

    let model_viewer = document.getElementById('model-viewer-mesh');
    let meshFileName = "mesh.glb";
    model_viewer.src = `https://raw.githubusercontent.com/zju3dv/GURecon/main/assets/meshes/${meshFolder}/${meshFileName}`;
    // https://raw.githubusercontent.com/zju3dv/GURecon/main/assets/meshes/Barn/mesh.glb

    model_viewer = document.getElementById('model-viewer-uc');
    meshFileName = "colored_mesh.glb";
    model_viewer.src = `https://raw.githubusercontent.com/zju3dv/GURecon/main/assets/meshes/${meshFolder}/${meshFileName}`;
}

function updateImages(sections, idx, imagesLength, sliderType) {
    let gifs = [];
    for (let i = 0; i < imagesLength; i++) {
        let imageContainer = sections[i].getElementsByClassName('b-dics__image-container')[0];
        if (imageContainer) {
            let image = imageContainer.getElementsByClassName('b-dics__image')[0];
            if (image) {
                let imageFolder   = getImageFolder(idx, sliderType);
                let imageFileName = getImageFileName(i, sliderType);
                image.src = `sources/images/compare/${imageFolder}/${imageFileName}`;
                if (image.src.endsWith('.gif')) {
                    gifs.push(image);
                }
                image.style.width = '1080px';
                image.style.objectFit = 'cover';
                image.style.objectPosition = 'center';
            }
        }
    }
    gifs.forEach(gif => {
        let src = gif.src;
        gif.src = '';
        gif.src = src;
    });
}

function getImageFolder(idx, sliderType=false) {
    // let folders = ['stump', 'bicycle', 'treehill', 'flowers', 'caterpillar', 'barn', 'playground', 'train', 'truck', 'm60'];
    let folders = ['Barn', 'Caterpillar', 'Truck'];
    return folders[idx];
}

function getImageFileName(imageIndex, sliderType=false) {
    // let filenames = ['3dgs.png', 'ours.png', 'gt.png'];
    // let filenames = ['gt.png', 'ours.png', 'sugar.png', 'neus.png', 'neuralangelo.png'];
    let filenames = ['gt_normal.gif', 'pred_normal.gif', 'gt_unc.gif', 'bayes_unc.gif',"ours_unc.gif"];
    return filenames[imageIndex];
}