"""Render the editable 63-second overview film from local project assets.

Requires Python, Pillow, and FFmpeg. No synthesized navigation data or audio.
Run from any directory: python SuperNav-1.5/scripts/render_overview.py
"""
import argparse
from functools import lru_cache
import json
import math
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
W, H, FPS, DURATION = 1920, 1080, 30, 63
BG, CARD, INK = "#e4e4e0", "#f7f7f5", "#050505"
MUTED, LINE, ORANGE, YELLOW = "#595953", "#d3d3cd", "#ff7f00", "#fbff00"
STAGES = [(0, "title"), (6, "grid"), (18, "memory"), (24, "geometry"),
          (35, "navigation"), (43, "comparison"), (57, "closing")]


def ease(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)


def lerp(a, b, progress):
    return a + (b - a) * progress


@lru_cache(maxsize=128)
def font(size, weight="medium"):
    filename = {"regular": "font-2.ttf", "medium": "font-3.ttf",
                "bold": "font-4.ttf", "mono": "font-1.ttf"}[weight]
    return ImageFont.truetype(str(ROOT / "assets/fonts" / filename), round(size))


def text(image, value, x, y, size=48, fill=INK, weight="medium", anchor="mm", opacity=1):
    if opacity <= 0:
        return
    if opacity >= 1:
        ImageDraw.Draw(image).text((x, y), value, font=font(size, weight), fill=fill, anchor=anchor)
    else:
        layer = Image.new("RGBA", (W, H))
        ImageDraw.Draw(layer).text((x, y), value, font=font(size, weight), fill=fill, anchor=anchor)
        image.paste(layer, (0, 0), layer.getchannel("A").point(lambda a: round(a * opacity)))


def heading(image, label, number):
    d = ImageDraw.Draw(image)
    d.ellipse((100, 85, 112, 97), fill=ORANGE)
    text(image, label.upper(), 132, 91, 22, anchor="lm", weight="mono")
    text(image, number, 1810, 91, 22, MUTED, "mono", "rm")


def footer(image, label="STRUCTURED MEMORY. PURPOSEFUL NAVIGATION."):
    text(image, "SuperNav-1.5", 100, 1020, 22, anchor="lm", weight="bold")
    text(image, label, 1820, 1020, 18, MUTED, "mono", "rm")


def brand(image, y=470, size=154, opacity=1):
    chunks = [("Super", INK), ("Nav", ORANGE), ("-1.5", INK)]
    widths = [font(size, "bold").getlength(value) for value, _ in chunks]
    x = (W - sum(widths)) / 2
    for (value, color), width in zip(chunks, widths):
        text(image, value, x, y, size, color, "bold", "lm", opacity)
        x += width


def card(image, box, radius=24):
    ImageDraw.Draw(image).rounded_rectangle(tuple(round(v) for v in box), radius, CARD, LINE, 2)


def dot(image, x, y, radius=15, label=None, color=ORANGE):
    d = ImageDraw.Draw(image)
    d.ellipse((x-radius-7, y-radius-7, x+radius+7, y+radius+7), fill=CARD, outline=LINE, width=2)
    d.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color)
    if label is not None:
        text(image, str(label), x, y, 20, INK, "bold")


class VideoFrames:
    def __init__(self, source, size, offset=3):
        self.size = size
        self.last = -1
        self.frame = None
        width, height = size
        filters = (f"fps={FPS},scale={width}:{height}:force_original_aspect_ratio=decrease,"
                   f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=0x171813,setsar=1")
        self.process = subprocess.Popen([
            "ffmpeg", "-v", "error", "-threads", "2", "-ss", str(offset),
            "-stream_loop", "-1", "-i", str(ROOT / source), "-an", "-sn", "-dn",
            "-vf", filters, "-threads", "2", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"
        ], stdout=subprocess.PIPE)

    def get(self, seconds):
        target = max(0, round(seconds * FPS))
        while self.last < target:
            payload = self.process.stdout.read(self.size[0] * self.size[1] * 3)
            if len(payload) != self.size[0] * self.size[1] * 3:
                raise RuntimeError("Video decoder stopped before the end of the montage")
            self.frame = Image.frombytes("RGB", self.size, payload)
            self.last += 1
        return self.frame

    def close(self):
        # These decoders only produce raw frames, so no trailer needs flushing.
        # Stop before closing the pipe to avoid noisy expected broken-pipe logs.
        if self.process.poll() is None:
            self.process.kill()
        self.process.stdout.close()
        self.process.wait()


class Overview:
    def __init__(self):
        catalog = json.loads((ROOT / "assets/demos.json").read_text())
        self.demos = [catalog[0]["groups"][i]["videos"][0] for i in range(3)]
        self.demos += [catalog[1]["groups"][i]["videos"][0] for i in range(3)]
        self.labels = ["Real world · Long-distance", "Real world · Multi-object", "Real world · Demand-driven",
                       "Simulation · Single-object", "Simulation · Multi-object", "Simulation · Multi-session"]
        self.decoders = None
        self.posters = [Image.open(ROOT / v["poster"]).convert("RGB") for v in self.demos]
        pipeline = Image.open(ROOT / "assets/images/pipeline.webp").convert("RGB")
        # Exact annotated occupancy-map excerpt from the paper's pipeline figure.
        factor = pipeline.width / 2048
        crop = tuple(round(v * factor) for v in (28, 160, 493, 636))
        self.map = pipeline.crop(crop)
        self.map.thumbnail((780, 660), Image.Resampling.LANCZOS)
        self.map_origin = (round(720-self.map.width/2), 207)
        self.node_ids = [1, 6, 3, 7, 8, 9]
        self.node_locations = [(296, 208), (156, 384), (276, 413), (342, 415), (368, 502), (305, 515)]
        self.node_locations = [(self.map_origin[0] + (x-28) / 465 * self.map.width,
                                self.map_origin[1] + (y-160) / 476 * self.map.height)
                               for x, y in self.node_locations]
        cases = json.loads((ROOT / "assets/trajectories/cases.json").read_text())
        self.case = next(c for c in cases if "0941_841859" in c["scene"])
        self.panels = []
        for panel in self.case["panels"]:
            raster = Image.open(ROOT / panel["map"]).convert("RGB")
            raster.thumbnail((620, 565), Image.Resampling.LANCZOS)
            points = panel["points"]
            distances = [0]
            for a, b in zip(points, points[1:]):
                distances.append(distances[-1] + math.dist(a, b))
            self.panels.append((panel, raster, distances))

    def title(self, t, closing=False):
        image = Image.new("RGB", (W, H), BG)
        if closing:
            brand(image, 420, 150, ease(t/.7))
            alpha = ease((t-.5)/.8)
            text(image, "Structured Spatial Memory", 960, 580, 56, opacity=alpha)
            text(image, "For Agentic Navigation Systems", 960, 655, 56, opacity=alpha)
            text(image, "EXPLORE → REMEMBER → NAVIGATE", 960, 835, 27, MUTED, "mono", opacity=ease((t-1.2)/.7))
        else:
            p = ease((t-1.3)/1.4)
            brand(image, lerp(540, 360, p), lerp(170, 126, p), ease(t/.55))
            alpha = ease((t-2.4)/.8)
            text(image, "Structured Spatial Memory", 960, 550, 64, opacity=alpha)
            text(image, "For Agentic Navigation Systems", 960, 635, 64, opacity=alpha)
            text(image, "A LITTLE MEMORY. A LONG WAY FORWARD.", 960, 835, 25, MUTED, "mono", opacity=ease((t-3.6)/.7))
        footer(image)
        return image

    def grid(self, t, preview=False):
        image = Image.new("RGB", (W, H), BG)
        heading(image, "One system. Many journeys.", "01 / 05")
        text(image, "Explore. Remember. Navigate.", 960, 150, 58)
        for i, demo in enumerate(self.demos):
            arrival = 0 if i == 0 else 1 + (i-1)*.8
            if t < arrival:
                continue
            target = (110 + (i % 3)*576, 220 + (i // 3)*372, 548, 308)
            if i == 0:
                progress = ease((t-1)/1.5)
                x, y, width, height = [lerp(a,b,progress) for a,b in zip((370,180,1180,664),target)]
                alpha = 1
            else:
                progress = ease((t-arrival)/.8)
                x, y, width, height = target
                x += (1-progress)*170
                y += (1-progress)*40
                alpha = progress
            if not preview and self.decoders:
                frame = self.decoders[i].get(max(0,t-arrival))
            else:
                frame = self.posters[i]
            width, height, x, y = round(width), round(height), round(x), round(y)
            frame = ImageOps.pad(frame, (width,height), color="#171813")
            layer = Image.new("RGBA", (W,H))
            d = ImageDraw.Draw(layer)
            d.rounded_rectangle((x-2,y-2,x+width+2,y+height+48),14,CARD,LINE,2)
            layer.paste(frame,(x,y))
            d.text((x+16,y+height+23), self.labels[i], font=font(21), fill=INK, anchor="lm")
            image.paste(layer,(0,0),layer.getchannel("A").point(lambda a:round(a*alpha)))
        footer(image, "REAL-WORLD + SIMULATION DEMONSTRATIONS")
        return image

    def memory(self, t):
        image = Image.new("RGB", (W,H), BG)
        heading(image, "Structured spatial memory", "02 / 05")
        text(image, "Agent Maintained Memory Node", 960, 420, 88, weight="bold", opacity=ease(t/.6))
        for i in range(6):
            p = ease((t-1.2-i*.3)/.5)
            if p:
                dot(image, 610+i*140, 650, max(1,round(20*p)))
        text(image, "Scene recall, connected to navigable space.", 960, 835, 34, MUTED, opacity=ease((t-3.2)/.7))
        footer(image)
        return image

    def geometry(self, t):
        image = Image.new("RGB", (W,H), BG)
        heading(image, "Structured spatial memory", "03 / 05")
        transition = ease(t/1.3)
        title_alpha = (1-ease((t-1.3)/.7))
        text(image, "Agent Maintained Memory Node", lerp(960,690,transition), lerp(420,370,transition),
             lerp(88,65,transition), weight="bold", opacity=title_alpha)
        text(image, "Grounded in Geometry", 700, 460, 88, weight="bold",
             opacity=ease((t-1.6)/.7)*(1-ease((t-3.7)/.7)))
        map_alpha = ease((t-4)/.8)
        if map_alpha:
            layer = Image.new("RGB", (W,H), BG)
            card(layer, (120,170,1300,960))
            layer.paste(self.map,self.map_origin)
            text(layer,"ANNOTATED SLAM MAP",720,918,24,MUTED,"mono")
            image = Image.blend(image,layer,map_alpha)
        for i in range(6):
            x = lerp(610+i*140,1530,transition)
            y = lerp(650,300+i*100,transition)
            p = ease((t-5-i*.23)/1.7)
            endx,endy = self.node_locations[i]
            x = lerp(x,endx,p)
            y = lerp(y,endy,p)-math.sin(p*math.pi)*100
            dot(image,x,y,20,self.node_ids[i] if p>.9 else None)
            if p<.03 and transition>.95:
                text(image,f"Memory node {self.node_ids[i]:02}",1575,y,25,anchor="lm",opacity=ease((t-1)/.5))
        text(image,"Memory grounded",1530,810,38,weight="bold",opacity=ease((t-8)/.8))
        text(image,"in navigable space.",1530,865,34,MUTED,opacity=ease((t-8.4)/.8))
        footer(image,"MAP EXCERPT FROM THE SUPERNAV-1.5 PIPELINE")
        return image

    def navigation(self,t):
        image = Image.new("RGB",(W,H),BG)
        heading(image,"Navigation with spatial memory","04 / 05")
        text(image,"Navigation with Memory Efficiently",960,425,86,weight="bold",opacity=ease(t/.7))
        values = ["Memory Query", "Geometric Navigation", "Agent Guided Relocalization"]
        centers = [355,870,1490]
        for i,(value,x) in enumerate(zip(values,centers)):
            p=ease((t-1.5-i*1.1)/.65)
            text(image,value,x,625+(1-p)*20,34,opacity=p)
            if i<2:
                text(image,"|",[590,1150][i],625,34,ORANGE,opacity=p)
        footer(image)
        return image

    def comparison(self,t):
        image=Image.new("RGB",(W,H),BG)
        heading(image,"Same goal. Less wandering.","05 / 05")
        text(image,"Navigation with memory",960,165,65,weight="bold")
        text(image,"Goal: find the bedside table lamp",960,241,31,MUTED)
        max_length=max(p[0]["pathLength"] for p in self.panels)
        travel=max(0,t-.7)/11*max_length
        for i,(panel,raster,distances) in enumerate(self.panels):
            left=120+i*860
            card(image,(left,305,left+820,940))
            color=INK if i==0 else ORANGE
            d=ImageDraw.Draw(image)
            d.ellipse((left+32,339,left+44,351),fill=color)
            text(image,panel["label"],left+62,345,29,anchor="lm",weight="bold")
            mx=left+410-raster.width/2
            my=390+(455-raster.height)/2
            # Fit maps identically within each panel without altering coordinates.
            scale=min(620/panel["width"],455/panel["height"])
            rw,rh=round(panel["width"]*scale),round(panel["height"]*scale)
            map_image=raster.resize((rw,rh),Image.Resampling.LANCZOS)
            mx,my=left+410-rw/2,390+(455-rh)/2
            image.paste(map_image,(round(mx),round(my)))
            points=panel["points"]
            fraction=min(1,travel/panel["pathLength"])
            distance=fraction*distances[-1]
            partial=[points[0]]
            for j in range(1,len(points)):
                if distances[j]<=distance:
                    partial.append(points[j])
                else:
                    p=(distance-distances[j-1])/(distances[j]-distances[j-1]) if distances[j]>distances[j-1] else 1
                    partial.append([lerp(points[j-1][k],points[j][k],p) for k in (0,1)])
                    break
            transformed=[(mx+x*scale,my+y*scale) for x,y in partial]
            if len(transformed)>1:
                d.line(transformed,fill=color,width=5,joint="curve")
            x,y=transformed[-1]
            d.ellipse((x-7,y-7,x+7,y+7),fill=YELLOW if i==0 else ORANGE,outline=INK,width=2)
            for j,(gx,gy) in enumerate(panel["targets"]):
                x,y=mx+gx*scale,my+gy*scale
                d.ellipse((x-10,y-10,x+10,y+10),fill=CARD,outline=INK,width=2)
                text(image,str(j+1),x,y,14,weight="bold")
            if fraction>=1:
                d.line([(left+677,345),(left+684,352),(left+697,335)],fill="#227443",width=4)
                text(image,"Done",left+780,345,25,"#227443",anchor="rm")
            d.line((left+30,875,left+790,875),fill=LINE,width=2)
            text(image,f'{panel["pathLength"]:.1f} m',left+32,906,29,weight="mono",anchor="lm")
            text(image,f'SPL {panel["spl"]:.3f}',left+788,906,29,weight="mono",anchor="rm")
        footer(image,"RECORDED PATHS · SHARED DISTANCE RATE · NOT EXECUTION TIMING")
        return image

    def scene(self,name,t,preview=False):
        if name=="title":return self.title(t)
        if name=="closing":return self.title(t,True)
        if name=="grid":return self.grid(t,preview)
        return getattr(self,name)(t)

    def frame(self,t,preview=False):
        index=max(i for i,(start,_) in enumerate(STAGES) if t>=start)
        start,name=STAGES[index]
        image=self.scene(name,t-start,preview)
        if index and t-start<.35:
            old_start,old_name=STAGES[index-1]
            # Previous grid endpoint is frozen during its transition out.
            old=self.scene(old_name,start-old_start-.001,preview)
            image=Image.blend(old,image,ease((t-start)/.35))
        if t>DURATION-.6:
            image=Image.blend(image,Image.new("RGB",(W,H),BG),ease((t-(DURATION-.6))/.6))
        return image

    def render(self,output):
        output.parent.mkdir(parents=True,exist_ok=True)
        self.decoders=[VideoFrames(v["src"],(1280,720) if i==0 else (548,308)) for i,v in enumerate(self.demos)]
        encoder=subprocess.Popen([
            "ffmpeg","-y","-v","error","-f","rawvideo","-pix_fmt","rgb24",
            "-s",f"{W}x{H}","-r",str(FPS),"-i","pipe:0","-an","-c:v","libx264",
            "-threads","4","-preset","fast","-crf","19","-pix_fmt","yuv420p",
            "-movflags","+faststart",str(output)
        ],stdin=subprocess.PIPE)
        try:
            for n in range(DURATION*FPS):
                encoder.stdin.write(self.frame(n/FPS).tobytes())
                if n%(FPS*3)==0:print(f"Rendered {n/FPS:.0f}/{DURATION}s",flush=True)
            encoder.stdin.close()
            if encoder.wait():raise RuntimeError("FFmpeg encoding failed")
        finally:
            if encoder.poll() is None:
                encoder.terminate()
                encoder.wait()
            for decoder in self.decoders:decoder.close()
        self.frame(3.8,True).save(output.with_suffix(".webp"),quality=94)
        print(output,flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output",type=Path,default=ROOT/"assets/overview/supernav-1.5-overview.mp4")
    parser.add_argument("--storyboard",type=Path,help="Render a storyboard instead of the movie")
    args=parser.parse_args()
    movie=Overview()
    if args.storyboard:
        samples=[.7,3.8,6.6,11.8,21.5,26.8,30.8,33.7,37.1,40.5,49,55.5,60]
        sheet=Image.new("RGB",(960*3,570*math.ceil(len(samples)/3)),BG)
        for i,t in enumerate(samples):
            frame=movie.frame(t,True).resize((960,540),Image.Resampling.LANCZOS)
            x,y=(i%3)*960,(i//3)*570
            sheet.paste(frame,(x,y))
            ImageDraw.Draw(sheet).text((x+15,y+540),f"{t:.1f}s",font=font(20,"mono"),fill=INK)
        args.storyboard.parent.mkdir(parents=True,exist_ok=True)
        sheet.save(args.storyboard)
        print(args.storyboard)
    else:
        movie.render(args.output)


if __name__=="__main__":main()
