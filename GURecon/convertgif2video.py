import os

import tqdm
from PIL import Image
import imageio
import glob
import numpy as np

# 设置路径
input_path = "/home/zesongyang/Projects/zju3dv.github.io/GURecon/sources/images/compare/*/*.gif"


# 获取所有 GIF 文件


# 定义处理函数
def process_gif(input_gif_path, output_gif_path, target_fps=30, scale_factor=0.5):
    # 读取 GIF 文件
    gif = Image.open(input_gif_path)

    # 获取 GIF 动画的所有帧
    frames = []
    while True:
        frames.append(gif.copy())
        try:
            gif.seek(gif.tell() + 1)
        except EOFError:
            break

    # 调整图像分辨率（缩小一半）
    resized_gif = []
    for frame in frames[::2]:
        # 缩小分辨率
        img = frame.convert("RGB").resize((frame.width // 2, frame.height // 2))
        resized_gif.append(img)

    # 增加 FPS 并保存新的 GIF
    imageio.mimsave(output_gif_path, resized_gif, fps=20, loop=0)


# 处理每个 GIF 文件
for gif_file in tqdm.tqdm(glob.glob(input_path)):
    output_gif = gif_file  # .split(".gif")[0] + "_resize.gif"
    process_gif(gif_file, output_gif)
    # print(f"处理完成：{gif_file} -> {output_gif}")
