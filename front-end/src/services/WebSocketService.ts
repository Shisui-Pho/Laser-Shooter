import type { User } from "../models/User";

//Websocket message model
export interface GameMessage {
  type: string;
  payload: any;
}

//Websocket class
class WebSocketService {
  private socket: WebSocket | null = null;
  //An event halder for the messages that can be changes
  private messageHandler: (msg: GameMessage) => void = () => {};
  //Connect to the websocket
  connect(
    lobbyCode: string,
    teamId: string,
    userId: number,
    onMessage: (msg: GameMessage) => void
  ) {
    //If the connection has already been established, we shold stop the creation of a new one.
    if (this.socket) {
      return;
    }
    this.socket = new WebSocket(`ws://127.0.0.1:8000/ws/${lobbyCode}/${teamId}/${userId}`);

    this.socket.onopen = () => {
      console.log("Connected to WebSocket");
    };
    this.messageHandler = onMessage;

    //Lets parse the websocket message
    this.socket.onmessage = (event) => {
      try {
        console.log("Raw WebSocket message:", event.data);

        //Get the raw message from websocket
        let message: any = JSON.parse(event.data);

        //Double parse if message is still a string(single parsing led to type errors)
        if (typeof message === "string") {
          message = JSON.parse(message);
        }

        //Return if the message is invalid
        if (!message || typeof message !== "object" || !("type" in message)) {
          console.warn("WebSocket: Invalid message:", message);
          return;
        }

        //If we failed to parse the message, print the error in console
        this.messageHandler(message as GameMessage);
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    //Close the socket connection 
    this.socket.onclose = () => {
      console.log("Disconnected from WebSocket");
    };
  }

  //update the message handler
  chageMessageHandler(onMessage:(msg: GameMessage)=>void){
    this.messageHandler = onMessage;
  }
  
  isConnected() {
  return this.socket && this.socket.readyState === WebSocket.OPEN;
}

  // Method to send a shot
  sendShot(image: string, player: User, color: string) {
  if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

  const shotData = {
    image: image,
    player: {
      id: player.id, 
      name: player.callName,
      team_id: player.teamId,
      hits: player.hits || 0
    },
    color: color
  };

  console.log("Sending shot:", shotData);
  
  try {
    this.socket.send(JSON.stringify(shotData));
  } catch (error) {
    console.error("Error sending shot:", error);
  }
}

  //Close the websocket connection
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new WebSocketService();