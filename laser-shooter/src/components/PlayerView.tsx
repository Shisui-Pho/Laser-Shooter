import React, {useEffect, useRef, useState} from "react";
import CameraService from "../services/CameraService";

function PlayerView(){
    //Create a reference to the <video> DOM element
    const videoRef=useRef<HTMLVideoElement>(null);

    //Hold error messages
    const [error, setError]=useState<string |null>(null);

    //Start the camera service once the component mounts
    useEffect(()=>{
        //Check if the video element is rendered
        const initCamera=async()=>{
            if(videoRef.current){
                try{
                    await CameraService.StartCamera(videoRef.current);
                }
                catch(error){
                    console.log("Unable to start camera: "+ error)
                    setError("Unable to start camera: "+ error);
                }
            }
        };

        initCamera();

        //Stop the camera service once the component unmounts
        return ()=>{
            CameraService.stopCamera();
        };
        
    },[]);


    return(
        <div>
            {error && <p>{error}</p>}
            <video ref={videoRef} autoPlay playsInline style={{width:"100%",height:"100%"}}/>
        </div>
    )
}

export default PlayerView;