import React, { useEffect, useRef, useState } from "react";
import CameraService from "../services/CameraService";
import Crosshair from "../widgets/Crosshair";
import ColorDetectionService from "../services/ColorDetectionService";
import type { DetectedColor } from "../services/ColorDetectionService";


function PlayerView(){
    //Create a reference to the <video> DOM element
    const videoRef=useRef<HTMLVideoElement>(null);

    const canvasRef=useRef<HTMLCanvasElement>(null);

    const [crosshairColor, setCrosshairColor]=useState<DetectedColor>("white");


    //Hold error messages
    const [error, setError]=useState<string |null>(null);

    //Start the camera service once the component mounts
    useEffect(()=>{
        //Check if the video element is rendered
            if(videoRef.current){
                try{
                     CameraService.startCamera(videoRef.current);
                }
                catch(error){
                    console.log("Unable to start camera: "+ error)
                    setError("Unable to start camera: "+ error);
                }
            }


        //Stop the camera service once the component unmounts
        return ()=>{
            CameraService.stopCamera();
        };
        
    },[]);

    //Color detection on crosshair
    useEffect(()=>{
        const detectLoop=()=>{
            const video=videoRef.current;
            const canvas=canvasRef.current;
            if(video && canvas){
                const color=ColorDetectionService.detectColor(video,canvas);
                setCrosshairColor(color);
            }
            requestAnimationFrame(detectLoop);
        };
        requestAnimationFrame(detectLoop);
    },[]);




    return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <Crosshair color={crosshairColor} />
    </div>
    );

}

export default PlayerView;