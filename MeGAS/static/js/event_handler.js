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
    let imagesLength = 6; // TODO

    updateImages(sections, idx, imagesLength, 'object');
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
                gifs.push(image);
                image.style.width = '768px';
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
    let folders = ['alameda', 'berlin', 'nyc', 'figurines', 'teatime', 'waldo'];
    return folders[idx];
}

function getImageFileName(imageIndex, sliderType=false) {
    let filenames = ['gsgroup_feat.png', 'gsgroup_mask.png', 'langsplat_feat.png', 'langsplat_mask.png', 'ours_feat.png', 'ours_mask.png'];
    return filenames[imageIndex];
}