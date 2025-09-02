export type DetectedColor="red"|"green"|"blue"|"white";

class ColorDetectionService{
    
    detectColor(video:HTMLVideoElement,canvas:HTMLCanvasElement)
        :DetectedColor{
            //Get 2d drawing context from canvas
            const ctx=canvas.getContext("2d");

            //If no context is available, return white
            if(!ctx) return "white";

            //Match the width and height of canvas to that of the video frame
            canvas.width=video.videoWidth;
            canvas.height=video.videoHeight;

            //Draw current video frame on canvas
            ctx.drawImage(video,0,0,canvas.width,canvas.height)

            //Define small area in the center of the frame
            const size=10;
            const x=Math.floor(canvas.width/2-size/2);
            const y=Math.floor(canvas.height/2-size/2);

            //Extract image data for the small area
            const imageData=ctx.getImageData(x,y,size,size);

            //Initialize rgb variables and assign them to every 4 adjacent pixels
            let r=0,g=0,b=0;
            const pixels=imageData.data;
            for(let i=0;i<pixels.length;i+=4){
                r+=pixels[i];
                g+=pixels[i+1];
                b+=pixels[i+2];
            }

            //Calculate average of the rgb values 
            const pixelCount = pixels.length / 4;
            r/=pixelCount;
            g/=pixelCount;
            b/=pixelCount;

            //check the dominant color and return it
            const threshold = 100;
            if (r>threshold && r>g * 1.2 && r>b * 1.2) return "red";
            if (g>threshold && g>r * 1.2 && g>b * 1.2) return "green";
            if (b>threshold && b>r * 1.2 && b>g * 1.2) return "blue";

            //return default of white
            return "white";

            
    }
}

export default new ColorDetectionService();