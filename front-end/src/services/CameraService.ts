
class CameraService{
    private stream:MediaStream | null=null;

    //Method to start the camera
    async startCamera(videoElement:HTMLVideoElement)
        :Promise<void>{
        
        try{
            this.stream=await navigator.mediaDevices.getUserMedia({video:true});
            videoElement.srcObject=this.stream;
        }
        catch(error){
            console.log("Failed to start camera: "+error)
        }
    }

    //Method to stop the camera
    stopCamera():void{
        if(this.stream){
            this.stream.getTracks().forEach((track)=>track.stop());
            this.stream=null;
        }
    }
}

export default new CameraService();